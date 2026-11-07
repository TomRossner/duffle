import { cookies } from "next/headers";
import { CalendarDays } from "lucide-react";
import { AirlineLogo } from "@/components/airline-logo";
import { EmptyState } from "@/components/empty-state";
import { PlaceLinks } from "@/components/place-links";
import { ActivityEditor, PlanEditor, ScheduleItemMenu } from "@/components/day-editor";
import { MemberTag } from "@/components/member-tag";
import { FlightEditor, PlanForm, PlanTag, StayEditor } from "@/components/plan-form";
import { ScheduleBoard, ScheduleItem } from "@/components/schedule-board";
import { deleteActivity } from "@/lib/actions/destinations";
import { deleteFlight, deleteScheduleItem, deleteStay } from "@/lib/actions/schedule";
import { dateKey, eachDate, formatDateLong, formatTime } from "@/lib/dates";
import {
  airlineCodeOf,
  dayOffset,
  formatMinutes,
  MAX_CONNECTION_MINUTES,
  minutesBetween,
  terminalLabel,
} from "@/lib/flight-lookup";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

export default async function SchedulePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const layoutCookie = (await cookies()).get("duffle-schedule-layout")?.value;
  const initialLayout = layoutCookie === "calendar" ? "calendar" : "list";
  const { trip } = await requireTrip(tripId);
  const [members, destinations, flights, stays, items, weatherDays] = await Promise.all([
    acceptedMembers(tripId),
    prisma.destination.findMany({
      where: { tripId },
      include: { activities: true },
      orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.flight.findMany({
      where: { tripId },
      include: { travelers: { include: { user: true } } },
      orderBy: { departAt: "asc" },
    }),
    prisma.stay.findMany({ where: { tripId }, orderBy: { checkIn: "asc" } }),
    prisma.scheduleItem.findMany({ where: { tripId }, orderBy: { startAt: "asc" } }),
    prisma.weatherDay.findMany({ where: { destination: { tripId } } }),
  ]);

  const flightLookup = Boolean(process.env.AERODATABOX_API_KEY);
  // Flight times are stored as each airport's local wall-clock time, so "YYYY-MM-DDTHH:mm" is that local time.
  const localTime = (date: Date) => date.toISOString().slice(0, 16);
  // A flight connects from an earlier one that lands at its departure airport within a day. Both times
  // are local to that airport, so the gap between them is the real layover.
  const connections = new Map<string, { from: (typeof flights)[number]; minutes: number }>();
  for (const flight of flights) {
    const from = flights
      .filter((other) => other.id !== flight.id && other.toAirport === flight.fromAirport)
      .map((other) => ({ from: other, minutes: minutesBetween(localTime(other.arriveAt), localTime(flight.departAt)) }))
      .filter((option) => option.minutes >= 0 && option.minutes <= MAX_CONNECTION_MINUTES)
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (from) connections.set(flight.id, from);
  }

  const people = members.map((member) => ({
    id: member.userId,
    label: <MemberTag userId={member.userId} name={member.user.name} imageKey={member.user.imageKey} />,
  }));
  const days = eachDate(trip.startDate, trip.endDate);
  const tripDays = days.map(dateKey);

  // Days each repeating plan/activity is on, so its edit form can show (and manage) all of them.
  const seriesDays = new Map<string, string[]>();
  const addSeriesDay = (seriesId: string | null, startAt: Date | null) => {
    if (!seriesId || !startAt) return;
    seriesDays.set(seriesId, [...(seriesDays.get(seriesId) ?? []), dateKey(startAt)]);
  };
  for (const item of items) addSeriesDay(item.seriesId, item.startAt);
  for (const destination of destinations) {
    for (const activity of destination.activities) addSeriesDay(activity.seriesId, activity.startAt);
  }
  const otherSeriesDays = (seriesId: string | null, startAt: Date | null) =>
    seriesId && startAt ? (seriesDays.get(seriesId) ?? []).filter((day) => day !== dateKey(startAt)) : [];
  const itemClass =
    // Wraps so the place buttons (basis-full, after the menu) get their own full-width row under the text and menu.
    "schedule-item flex flex-wrap items-start justify-between gap-x-3 in-data-[layout=calendar]:flex-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-sm in-data-[layout=calendar]:items-center in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:rounded-md in-data-[layout=calendar]:relative in-data-[layout=calendar]:w-full in-data-[layout=calendar]:min-w-0 in-data-[layout=calendar]:overflow-hidden in-data-[layout=calendar]:cursor-pointer in-data-[layout=calendar]:py-1 in-data-[layout=calendar]:pr-6 in-data-[layout=calendar]:pl-1.5 in-data-[layout=calendar]:text-xs in-data-[layout=calendar]:transition-colors in-data-[layout=calendar]:hover:border-foreground/30 in-data-[layout=calendar]:hover:bg-background in-data-[layout=calendar]:hover:shadow-sm";
  const detailClass = "in-data-[layout=calendar]:hidden";
  const titleClass =
    "flex w-full min-w-0 flex-wrap items-center gap-2 font-medium in-data-[layout=calendar]:flex-nowrap in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:overflow-hidden";

  return (
    <div className="grid gap-6">
      <PlanForm
        tripId={tripId}
        currency={trip.baseCurrency}
        people={people}
        destinations={destinations.map((destination) => ({ id: destination.id, name: destination.name }))}
        tripDays={tripDays}
        flightLookup={flightLookup}
      />

      {flights.length + stays.length + items.length + destinations.reduce((sum, destination) => sum + destination.activities.length, 0) === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing on the schedule yet" compact>
          Use Add a plan to put flights, tours, dinners and anything else on a day. Type a flight number to fill in
          its details. Your stays, and destination activities with a date, show up here too.
        </EmptyState>
      ) : null}

      <ScheduleBoard
        initialLayout={initialLayout}
        days={days.map((day) => {
          const key = dateKey(day);
          const weather = weatherDays.find((entry) => dateKey(entry.date) === key);
          const dayFlights = flights.filter((flight) => dateKey(flight.departAt) === key);
          const dayStays = stays.filter(
            (stay) => dateKey(stay.checkIn) === key || dateKey(stay.checkOut) === key,
          );
          const dayItems = items.filter((item) => dateKey(item.startAt) === key);
          const dayActivities = destinations.flatMap((destination) =>
            destination.activities
              .filter((activity) => activity.startAt && dateKey(activity.startAt) === key)
              .map((activity) => ({
                ...activity,
                place: destination.name,
                target:
                  activity.lat != null && activity.lng != null
                    ? { name: activity.title, placeId: activity.placeId, lat: activity.lat, lng: activity.lng }
                    : {
                        name: destination.name,
                        address: destination.address,
                        placeId: destination.placeId,
                        lat: destination.lat,
                        lng: destination.lng,
                      },
              })),
          );
          const empty =
            dayFlights.length + dayStays.length + dayItems.length + dayActivities.length === 0;

          const renderItems = () => (
              <>
                {empty ? (
                  <p className={`flex items-center gap-2 text-sm text-muted-foreground ${detailClass}`}>
                    <CalendarDays className="size-4" />
                    Nothing planned.
                  </p>
                ) : null}
                {[
                ...dayFlights.map((flight) => {
                  const connection = connections.get(flight.id);
                  const overnight = dayOffset(localTime(flight.departAt), localTime(flight.arriveAt));
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind="FLIGHT" />
                        <AirlineLogo
                          code={airlineCodeOf(flight.flightNumber)}
                          className="in-data-[layout=calendar]:hidden"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {formatTime(flight.departAt)} {flight.airline} {flight.flightNumber}
                        </span>
                      </p>
                      <p className={`text-muted-foreground ${detailClass}`}>
                        <span className="font-mono">{flight.fromAirport}</span>
                        {flight.fromTerminal ? ` (${terminalLabel(flight.fromTerminal)})` : ""} →{" "}
                        <span className="font-mono">{flight.toAirport}</span>
                        {flight.toTerminal ? ` (${terminalLabel(flight.toTerminal)})` : ""}, arrives{" "}
                        {formatTime(flight.arriveAt)}
                        {overnight !== 0 ? (
                          <sup className="ml-0.5">{overnight > 0 ? `+${overnight}` : overnight}</sup>
                        ) : null}
                        {flight.durationMinutes ? ` · ${formatMinutes(flight.durationMinutes)}` : ""}
                        {flight.confirmation ? ` · ${flight.confirmation}` : ""}
                      </p>
                      {connection ? (
                        <p className={`text-xs text-muted-foreground ${detailClass}`}>
                          {connection.from.flightNumber === flight.flightNumber
                            ? // The same number flying on: a stop, not a change of plane booked separately.
                              `Continues ${flight.airline} ${flight.flightNumber} after a ${formatMinutes(connection.minutes)} stop in ${flight.fromAirport}`
                            : `Connects from ${connection.from.airline} ${connection.from.flightNumber} · ${formatMinutes(connection.minutes)} layover in ${flight.fromAirport}`}
                        </p>
                      ) : null}
                      {flight.travelers.length > 0 ? (
                        <p className={`mt-1 flex flex-wrap gap-2 ${detailClass}`}>
                          {flight.travelers.map((traveler) => (
                            <MemberTag
                              key={traveler.userId}
                              userId={traveler.userId}
                              name={traveler.user.name}
                              imageKey={traveler.user.imageKey}
                            />
                          ))}
                        </p>
                      ) : null}
                    </div>
                    <ScheduleItemMenu
                      label={`${flight.airline} ${flight.flightNumber}`}
                      confirmMessage={`Are you sure you want to remove ${flight.airline} ${flight.flightNumber}?`}
                      remove={deleteFlight.bind(null, tripId, flight.id)}
                    >
                      <FlightEditor
                        tripId={tripId}
                        people={people}
                        lookup={flightLookup}
                        flight={{
                          id: flight.id,
                          airline: flight.airline,
                          flightNumber: flight.flightNumber,
                          fromAirport: flight.fromAirport,
                          toAirport: flight.toAirport,
                          fromTerminal: flight.fromTerminal ?? "",
                          toTerminal: flight.toTerminal ?? "",
                          durationMinutes: flight.durationMinutes,
                          departAt: localTime(flight.departAt),
                          arriveAt: localTime(flight.arriveAt),
                          confirmation: flight.confirmation ?? "",
                          notes: flight.notes ?? "",
                          travelerIds: flight.travelers.map((traveler) => traveler.userId),
                        }}
                      />
                    </ScheduleItemMenu>
                    <span className={`mt-2 grid basis-full gap-1.5 ${detailClass}`}>
                      <PlaceLinks
                        label={`To ${flight.fromAirport}`}
                        place={{
                          name: `${flight.fromAirport} airport`,
                          lat: flight.fromLat,
                          lng: flight.fromLng,
                        }}
                      />
                      <PlaceLinks
                        label={`To ${flight.toAirport}`}
                        place={{
                          name: `${flight.toAirport} airport`,
                          lat: flight.toLat,
                          lng: flight.toLng,
                        }}
                      />
                    </span>
                  </div>
                  );
                  return {
                    at: flight.departAt.getTime(),
                    node: (
                      <ScheduleItem
                        key={flight.id}
                        label={`${flight.airline} ${flight.flightNumber}`}
                        details={card()}
                      >
                        {card()}
                      </ScheduleItem>
                    ),
                  };
                }),
                ...dayStays.map((stay) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind="STAY" />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="hidden in-data-[layout=calendar]:inline">
                            {formatTime(dateKey(stay.checkIn) === key ? stay.checkIn : stay.checkOut)}{" "}
                          </span>
                          {dateKey(stay.checkIn) === key ? "Check in" : "Check out"} · {stay.name}
                        </span>
                      </p>
                      <p className={`text-muted-foreground ${detailClass}`}>
                        {formatTime(dateKey(stay.checkIn) === key ? stay.checkIn : stay.checkOut)}
                        {stay.address ? ` · ${stay.address}` : ""}
                      </p>
                    </div>
                    <ScheduleItemMenu
                      label={stay.name}
                      confirmMessage={`Are you sure you want to remove ${stay.name}?`}
                      remove={deleteStay.bind(null, tripId, stay.id)}
                    >
                      <StayEditor
                        tripId={tripId}
                        destinations={destinations.map((destination) => ({
                          id: destination.id,
                          name: destination.name,
                        }))}
                        stay={{
                          id: stay.id,
                          name: stay.name,
                          address: stay.address ?? "",
                          destinationId: stay.destinationId ?? "",
                          confirmation: stay.confirmation ?? "",
                          notes: stay.notes ?? "",
                          checkIn: stay.checkIn.toISOString().slice(0, 16),
                          checkOut: stay.checkOut.toISOString().slice(0, 16),
                        }}
                      />
                    </ScheduleItemMenu>
                    <PlaceLinks
                      className={`mt-1.5 basis-full ${detailClass}`}
                      place={{ name: stay.name, address: stay.address, lat: stay.lat, lng: stay.lng }}
                    />
                  </div>
                  );
                  const stayLabel = dateKey(stay.checkIn) === key ? `Check in · ${stay.name}` : `Check out · ${stay.name}`;
                  return {
                    at: (dateKey(stay.checkIn) === key ? stay.checkIn : stay.checkOut).getTime(),
                    node: (
                      <ScheduleItem key={`${stay.id}-${key}`} label={stayLabel} details={card()}>
                        {card()}
                      </ScheduleItem>
                    ),
                  };
                }),
                ...dayActivities.map((activity) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          <span className="hidden in-data-[layout=calendar]:inline">
                            {activity.startAt && !activity.allDay ? `${formatTime(activity.startAt)} ` : ""}
                          </span>
                          {activity.title}
                        </span>
                      </p>
                      <p className={`text-muted-foreground ${detailClass}`}>
                        {activity.place}
                        {activity.allDay
                          ? " · All day"
                          : activity.startAt
                            ? ` · ${formatTime(activity.startAt)}${activity.endAt ? `–${formatTime(activity.endAt)}` : ""}`
                            : ""}
                      </p>
                    </div>
                    <ScheduleItemMenu
                      label={activity.title}
                      confirmMessage={`Are you sure you want to remove ${activity.title}?`}
                      remove={deleteActivity.bind(null, tripId, activity.id)}
                    >
                      <ActivityEditor
                        tripId={tripId}
                        tripDays={tripDays}
                        activity={{
                          id: activity.id,
                          title: activity.title,
                          notes: activity.notes ?? "",
                          startAt: activity.startAt ? activity.startAt.toISOString().slice(0, 16) : "",
                          endAt: activity.endAt ? activity.endAt.toISOString().slice(0, 16) : "",
                          allDay: activity.allDay,
                          seriesDays: otherSeriesDays(activity.seriesId, activity.startAt),
                        }}
                      />
                    </ScheduleItemMenu>
                    <PlaceLinks className={`mt-1.5 basis-full ${detailClass}`} place={activity.target} />
                  </div>
                  );
                  return {
                    at: activity.allDay || !activity.startAt ? 0 : activity.startAt.getTime(),
                    node: (
                      <ScheduleItem key={activity.id} label={activity.title} details={card()}>
                        {card()}
                      </ScheduleItem>
                    ),
                  };
                }),
                ...dayItems.map((item) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind={item.kind} />
                        <span className="min-w-0 flex-1 truncate">
                          {item.allDay ? (
                            <span
                              className={`mr-1.5 rounded bg-background px-1.5 py-0.5 text-xs font-normal text-muted-foreground ${detailClass}`}
                            >
                              All day
                            </span>
                          ) : (
                            `${formatTime(item.startAt)}${item.endAt ? `–${formatTime(item.endAt)}` : ""} `
                          )}
                          {item.title}
                        </span>
                      </p>
                      {item.placeName ? <p className={`text-muted-foreground ${detailClass}`}>{item.placeName}</p> : null}
                    </div>
                    <ScheduleItemMenu
                      label={item.title}
                      confirmMessage={`Are you sure you want to remove ${item.title}?`}
                      remove={deleteScheduleItem.bind(null, tripId, item.id)}
                    >
                      <PlanEditor
                        tripId={tripId}
                        tripDays={tripDays}
                        plan={{
                          id: item.id,
                          title: item.title,
                          kind: item.kind,
                          startAt: item.startAt.toISOString().slice(0, 16),
                          endAt: item.endAt ? item.endAt.toISOString().slice(0, 16) : "",
                          allDay: item.allDay,
                          seriesDays: otherSeriesDays(item.seriesId, item.startAt),
                          placeName: item.placeName ?? "",
                          notes: item.notes ?? "",
                        }}
                      />
                    </ScheduleItemMenu>
                    {item.placeName || (item.lat != null && item.lng != null) ? (
                      <PlaceLinks
                        className={`mt-1.5 basis-full ${detailClass}`}
                        place={{ name: item.placeName || item.title, lat: item.lat, lng: item.lng }}
                      />
                    ) : null}
                  </div>
                  );
                  return {
                    at: item.allDay ? 0 : item.startAt.getTime(),
                    node: (
                      <ScheduleItem key={item.id} label={item.title} details={card()}>
                        {card()}
                      </ScheduleItem>
                    ),
                  };
                }),
                ]
                  // Earliest first; all-day plans lead the day.
                  .sort((a, b) => a.at - b.at)
                  .map((entry) => entry.node)}
                <div className={`grid ${detailClass}`}>
                  <PlanForm
                    tripId={tripId}
                    currency={trip.baseCurrency}
                    people={people}
                    destinations={destinations.map((destination) => ({ id: destination.id, name: destination.name }))}
                    tripDays={tripDays}
                    defaultDate={key}
                    compact
                    flightLookup={flightLookup}
                  />
                </div>
              </>
            );
            return {
            key,
            date: key,
            dateLabel: formatDateLong(day),
            condition: weather?.condition ?? null,
            forecast: weather
              ? `${weather.condition} · ${Math.round(weather.tempMin)}–${Math.round(weather.tempMax)}°C`
              : null,
            content: renderItems(),
            detail: renderItems(),
          };
        })}
      />
    </div>
  );
}
