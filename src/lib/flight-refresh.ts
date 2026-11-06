import { parseDateTime } from "@/lib/dates";
import {
  describeChange,
  fetchFlights,
  findSavedLeg,
  flightChanges,
  normalizeFlightNumber,
  recheckAfterMinutes,
} from "@/lib/flight-lookup";
import { notifyUsers } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { takeRateLimit } from "@/lib/rate-limit";

/**
 * Checks a traveler's upcoming flights against the airline's current schedule. When the departure or
 * arrival time or a terminal changed, it updates the flight and notifies everyone on it.
 *
 * It runs after a page of the app is sent (see AppShell), so it never slows a page down. Each check is
 * a paid AeroDataBox call, so a flight is checked at most every few hours near departure and once a day
 * before that (`recheckAfterMinutes`), a visit checks a few flights at most, and one traveler's visits
 * start a check at most every 15 minutes.
 */

/** How far ahead flights are checked. Schedules settle closer in, and the API has times a year out. */
const LOOKAHEAD_DAYS = 60;
const FLIGHTS_PER_VISIT = 4;

/** Flight times are stored as each airport's local wall-clock time, so the ISO string is that local time. */
const localTime = (date: Date) => date.toISOString().slice(0, 16);

export async function refreshUpcomingFlights(userId: string) {
  if (!process.env.AERODATABOX_API_KEY) return;
  if (!takeRateLimit(`flight-refresh:${userId}`, 1, 15 * 60 * 1000).ok) return;

  const now = new Date();
  // Local times stored as UTC are up to about 14 hours off real time, so allow for that at both ends.
  const flights = await prisma.flight.findMany({
    where: {
      departAt: { gte: new Date(now.getTime() - 14 * 60 * 60 * 1000), lte: new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000) },
      trip: { members: { some: { userId, status: "ACCEPTED" } } },
    },
    orderBy: { departAt: "asc" },
    take: 40,
    include: { travelers: { select: { userId: true } } },
  });

  const due = flights
    .filter((flight) => {
      if (!flight.checkedAt) return true;
      const minutesToDeparture = (flight.departAt.getTime() - now.getTime()) / 60_000;
      return now.getTime() - flight.checkedAt.getTime() >= recheckAfterMinutes(minutesToDeparture) * 60_000;
    })
    .slice(0, FLIGHTS_PER_VISIT);

  for (const flight of due) {
    // Claim the flight first, so two travelers on the same trip opening the app don't both check it.
    const claimed = await prisma.flight.updateMany({
      where: { id: flight.id, checkedAt: flight.checkedAt },
      data: { checkedAt: now },
    });
    if (claimed.count === 0) continue;

    const number = normalizeFlightNumber(flight.flightNumber);
    if (!number) continue;
    const saved = {
      fromAirport: flight.fromAirport,
      toAirport: flight.toAirport,
      departAt: localTime(flight.departAt),
      arriveAt: localTime(flight.arriveAt),
      fromTerminal: flight.fromTerminal,
      toTerminal: flight.toTerminal,
      durationMinutes: flight.durationMinutes,
    };
    const result = await fetchFlights(number, saved.departAt.slice(0, 10), { fresh: true });
    // Out of quota or unreachable: stop for this visit. The flight is checked again at its next turn.
    if ("error" in result) break;
    // No match is not a change: the flight may have been typed by hand, or the airline renumbered it.
    const leg = findSavedLeg(result.legs, saved);
    if (!leg) continue;
    const changes = flightChanges(saved, leg);
    // The flying time follows the schedule quietly: it fills in for a flight typed by hand, and a
    // retime that changes it is already in the notice.
    const duration =
      leg.durationMinutes != null && leg.durationMinutes !== flight.durationMinutes
        ? { durationMinutes: leg.durationMinutes }
        : {};
    if (changes.length === 0) {
      if ("durationMinutes" in duration) await prisma.flight.update({ where: { id: flight.id }, data: duration });
      continue;
    }

    const departAt = parseDateTime(leg.departAt);
    const arriveAt = parseDateTime(leg.arriveAt);
    await prisma.flight.update({
      where: { id: flight.id },
      data: {
        ...duration,
        ...(changes.some((change) => change.field === "departAt") && departAt ? { departAt } : {}),
        ...(changes.some((change) => change.field === "arriveAt") && arriveAt ? { arriveAt } : {}),
        ...(changes.some((change) => change.field === "fromTerminal") ? { fromTerminal: leg.fromTerminal } : {}),
        ...(changes.some((change) => change.field === "toTerminal") ? { toTerminal: leg.toTerminal } : {}),
      },
    });

    // Everyone on the flight hears about it; with no travelers set, the whole trip does.
    const travelers = flight.travelers.map((traveler) => traveler.userId);
    const recipients =
      travelers.length > 0
        ? travelers
        : (
            await prisma.tripMember.findMany({
              where: { tripId: flight.tripId, status: "ACCEPTED" },
              select: { userId: true },
            })
          ).map((member) => member.userId);
    await notifyUsers(flight.tripId, recipients, {
      kind: "FLIGHT",
      title: `${flight.airline} ${flight.flightNumber} changed`,
      body: `${flight.fromAirport} → ${flight.toAirport}: ${changes.map(describeChange).join(". ")}.`,
      href: `/trips/${flight.tripId}/schedule`,
    });
  }
}
