/**
 * Flight schedules from AeroDataBox (via RapidAPI). Given a flight number and the local departure date,
 * it returns the matching flights with airports, terminals, and scheduled local times, to prefill the
 * flight form.
 *
 * Every item AeroDataBox returns is one leg: one departure airport and one arrival airport. Most flight
 * numbers fly a single leg, but some keep the number through a stop. QF1 flies SYD–SIN, then SIN–LHR,
 * and the later leg can depart on the next local day. Each leg has its own times and terminals, and a
 * booking lists it as its own segment, so Duffle saves each leg as its own flight. The lookup asks for
 * flights departing or arriving on the date (`dateLocalRole=Both`), keeps the legs that depart that day,
 * and follows each onto the legs that continue it, so the form can add one leg or all of them.
 */

import type { Locale } from "@/i18n/config";

export type FlightMatch = {
  airline: string;
  flightNumber: string;
  fromAirport: string;
  fromName: string;
  fromTerminal: string;
  toAirport: string;
  toName: string;
  toTerminal: string;
  /** Local wall-clock time at each airport, "YYYY-MM-DDTHH:mm", as the flight form stores it. */
  departAt: string;
  arriveAt: string;
  /** Real time in the air, from the UTC times. Null when the API gave no time zone. */
  durationMinutes: number | null;
  codeshare: boolean;
};

/** The legs a flight number flies in a row from one departure: one leg for most flights. */
export type FlightJourney = FlightMatch[];

type AirportInfo = { iata?: string; icao?: string; name?: string; municipalityName?: string };
type TimeInfo = { utc?: string; local?: string };
type Movement = {
  airport?: AirportInfo;
  scheduledTime?: TimeInfo;
  revisedTime?: TimeInfo;
  terminal?: string | null;
  // Older API versions put the times on the movement itself.
  scheduledTimeLocal?: string;
};
type ApiFlight = {
  number?: string;
  codeshareStatus?: string;
  airline?: { name?: string; iata?: string };
  departure?: Movement;
  arrival?: Movement;
};

/** "lh 400", "LH-400", "lh0400" → "LH400". Returns null when it does not look like a flight number. */
export function normalizeFlightNumber(value: string) {
  const compact = value.toUpperCase().replace(/[\s-]+/g, "");
  const match = /^([A-Z0-9]{2}[A-Z]?)(\d{1,4}[A-Z]?)$/.exec(compact);
  if (!match || !/[A-Z]/.test(match[1])) return null;
  return `${match[1]}${match[2].replace(/^0+(?=\d)/, "")}`;
}

/** The scheduled moment, from "2026-11-10 12:55Z" or the local time with its offset. NaN when unknown. */
function instant(movement: Movement | undefined) {
  const raw = movement?.scheduledTime?.utc ?? movement?.scheduledTime?.local ?? "";
  // Without a Z or an offset the time is only local, which says nothing about the real moment.
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(raw.trim())) return NaN;
  return Date.parse(raw.trim().replace(" ", "T"));
}

/** Minutes from departure to arrival. Null when either time has no time zone or the result is not sensible. */
function duration(flight: ApiFlight) {
  const minutes = (instant(flight.arrival) - instant(flight.departure)) / 60_000;
  return Number.isFinite(minutes) && minutes > 0 && minutes < 30 * 60 ? Math.round(minutes) : null;
}

/** "2026-11-10 14:35+01:00" → "2026-11-10T14:35". */
function localTime(movement: Movement | undefined) {
  const raw = movement?.scheduledTime?.local ?? movement?.scheduledTimeLocal ?? movement?.revisedTime?.local;
  const match = raw ? /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(raw) : null;
  return match ? `${match[1]}T${match[2]}` : null;
}

function airportCode(airport: AirportInfo | undefined) {
  return (airport?.iata || airport?.icao || "").toUpperCase();
}

function airportName(airport: AirportInfo | undefined) {
  return airport?.name || airport?.municipalityName || "";
}

/** Minutes between two local times. Only meaningful when both are at the same airport. */
export function minutesBetween(from: string, to: string) {
  return (Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 60_000;
}

/** The longest stop between two legs of one flight number. */
const MAX_STOP_MINUTES = 12 * 60;

/** The leg that continues `leg` under the same flight number, if any. */
function nextLeg(legs: FlightMatch[], leg: FlightMatch) {
  return legs.find((candidate) => {
    if (candidate.flightNumber !== leg.flightNumber || candidate.fromAirport !== leg.toAirport) return false;
    const wait = minutesBetween(leg.arriveAt, candidate.departAt);
    return wait >= 0 && wait <= MAX_STOP_MINUTES;
  });
}

/**
 * The journeys departing on `date`, earliest first. Each is the legs flown in a row: [SYD–SIN, SIN–LHR]
 * for QF1, including a leg that departs the next day. A leg that continues one departing earlier the same
 * day is part of that journey, not one of its own.
 */
export function journeysOnDate(legs: FlightMatch[], date: string): FlightJourney[] {
  const journeys: FlightJourney[] = [];
  for (const leg of legs) {
    if (!leg.departAt.startsWith(date)) continue;
    const previous = legs.find((other) => nextLeg(legs, other) === leg);
    if (previous?.departAt.startsWith(date)) continue;
    const journey = [leg];
    for (let next = nextLeg(legs, leg); next && !journey.includes(next); next = nextLeg(legs, next)) {
      journey.push(next);
    }
    journeys.push(journey);
  }
  return journeys;
}

/** Reads AeroDataBox's flight list into legs, earliest departure first. */
export function parseFlights(data: unknown): FlightMatch[] {
  if (!Array.isArray(data)) return [];
  const matches: FlightMatch[] = [];
  const seen = new Set<string>();
  for (const flight of data as ApiFlight[]) {
    const fromAirport = airportCode(flight.departure?.airport);
    const toAirport = airportCode(flight.arrival?.airport);
    const departAt = localTime(flight.departure);
    const arriveAt = localTime(flight.arrival);
    if (!fromAirport || !toAirport || !departAt || !arriveAt) continue;
    const flightNumber = (flight.number ?? "").replace(/\s+/g, "");
    const key = `${flightNumber}|${fromAirport}|${toAirport}|${departAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({
      airline: flight.airline?.name?.trim() ?? "",
      flightNumber,
      fromAirport,
      fromName: airportName(flight.departure?.airport),
      fromTerminal: flight.departure?.terminal?.trim() ?? "",
      toAirport,
      toName: airportName(flight.arrival?.airport),
      toTerminal: flight.arrival?.terminal?.trim() ?? "",
      departAt,
      arriveAt,
      durationMinutes: duration(flight),
      codeshare: flight.codeshareStatus === "IsCodeshared",
    });
  }
  return matches.sort((a, b) => a.departAt.localeCompare(b.departAt));
}

const HOST = "aerodatabox.p.rapidapi.com";
const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { legs: FlightMatch[]; expiresAt: number }>();

/**
 * `date` is the local departure date, "YYYY-MM-DD". `fresh` skips the cache, for checking a saved
 * flight for changes; the answer still refreshes the cache for the next lookup. Returns the journeys
 * departing on the date, and every leg the lookup found (one may have moved to the next day).
 */
export async function fetchFlights(flightNumber: string, date: string, { fresh = false } = {}) {
  const key = process.env.AERODATABOX_API_KEY;
  if (!key) return { error: "Flight lookup is not set up on this server." };

  const cacheKey = `${flightNumber}|${date}`;
  const cached = cache.get(cacheKey);
  const result = (legs: FlightMatch[]) => ({ journeys: journeysOnDate(legs, date), legs });
  if (!fresh && cached && cached.expiresAt > Date.now()) return result(cached.legs);

  // Both: flights departing or arriving on the date, so a later leg on the next day still comes back.
  const url =
    `https://${HOST}/flights/number/${encodeURIComponent(flightNumber)}/${date}` +
    "?withAircraftImage=false&withLocation=false&dateLocalRole=Both";
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[aerodatabox] Request failed:", error);
    return { error: "Could not reach the flight service. Fill in the details by hand." };
  }

  // 204 is AeroDataBox's "nothing found". Treat 404 the same.
  if (response.status === 204 || response.status === 404) {
    cache.set(cacheKey, { legs: [], expiresAt: Date.now() + CACHE_MS });
    return result([]);
  }
  if (!response.ok) {
    console.error(`[aerodatabox] ${response.status}: ${(await response.text()).slice(0, 300)}`);
    if (response.status === 429) return { error: "The flight service is busy. Try again in a minute." };
    return { error: "The flight service could not look that up. Fill in the details by hand." };
  }

  const legs = parseFlights(await response.json());
  cache.set(cacheKey, { legs, expiresAt: Date.now() + CACHE_MS });
  return result(legs);
}

/**
 * The airline's IATA code from a flight number: "LH400" → "LH", "u2 8123" → "U2". Null for a three-letter
 * ICAO prefix ("EZY1234"), which the logo images are not keyed by.
 */
export function airlineCodeOf(flightNumber: string) {
  const normalized = normalizeFlightNumber(flightNumber);
  const code = normalized ? /^([A-Z0-9]{2})\d/.exec(normalized) : null;
  return code ? code[1] : null;
}

/** "TLV", "tlv", or the airport field's text "TLV · Ben Gurion International Airport" → "TLV". */
export function airportCodeOf(text: string) {
  const code = /^([A-Za-z0-9]{3,4})(?:\s+·\s.*)?$/.exec(text.trim());
  return code ? code[1].toUpperCase() : text.trim();
}

/** "SYD → SIN → LHR" for a journey's airports in order. */
export function journeyRoute(legs: Pick<FlightMatch, "fromAirport" | "toAirport">[]) {
  if (legs.length === 0) return "";
  return [legs[0].fromAirport, ...legs.map((leg) => leg.toAirport)].join(" → ");
}

/** "1" and "T1" → "Terminal 1", "2e" → "Terminal 2E", "B" → "Terminal B"; "Terminal 3" stays. Empty for none. */
const TERMINAL: Record<Locale, string> = {
  en: "Terminal",
  he: "טרמינל",
  es: "Terminal",
  fr: "Terminal",
  de: "Terminal",
  ru: "Терминал",
};

export function terminalLabel(terminal: string | null | undefined, locale: Locale = "en") {
  const value = (terminal ?? "").trim();
  const short = /^T?(\d{1,2}[A-Z]?|[A-Z])$/i.exec(value);
  return short ? `${TERMINAL[locale] ?? TERMINAL.en} ${short[1].toUpperCase()}` : value;
}

/** Days between the local departure and arrival dates: 1 for an overnight flight, -1 across the date line. */
export function dayOffset(departAt: string, arriveAt: string) {
  return Math.round(minutesBetween(`${departAt.slice(0, 10)}T00:00`, `${arriveAt.slice(0, 10)}T00:00`) / (24 * 60));
}

/** 95 → "1h 35m". */
/** Hour and minute abbreviations per language, for durations like "2h 30m". */
const DURATION_UNITS: Record<Locale, { h: string; m: string }> = {
  en: { h: "h", m: "m" },
  he: { h: " ש׳", m: " ד׳" },
  es: { h: " h", m: " min" },
  fr: { h: " h", m: " min" },
  de: { h: " Std.", m: " Min." },
  ru: { h: " ч", m: " мин" },
};

export function formatMinutes(minutes: number, locale: Locale = "en") {
  const { h, m } = DURATION_UNITS[locale] ?? DURATION_UNITS.en;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}${m}`;
  return rest === 0 ? `${hours}${h}` : `${hours}${h} ${rest}${m}`;
}

/** The most seats one flight can list. */
export const MAX_SEATS = 9;

/**
 * Seat numbers as typed ("14a 14b", "14A,14B; 15C") → "14A, 14B, 15C". Repeats are dropped. Null when empty,
 * an error when a seat isn't a short code or there are too many.
 */
export function normalizeSeats(value: string): { seats: string | null } | { error: string } {
  const seats = [
    ...new Set(
      value
        .split(/[\s,;/]+/)
        .map((seat) => seat.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  if (seats.length === 0) return { seats: null };
  if (seats.some((seat) => !/^[0-9A-Z]{1,5}$/.test(seat))) {
    return { error: "Enter seats as short codes like 14A, separated by commas." };
  }
  if (seats.length > MAX_SEATS) return { error: `Add up to ${MAX_SEATS} seats per flight.` };
  return { seats: seats.join(", ") };
}

/** "14A, 14B" → ["14A", "14B"]. */
export function seatList(seats: string | null | undefined) {
  return (seats ?? "").split(",").map((seat) => seat.trim()).filter(Boolean);
}

/** The longest gap between an arrival and the next departure from that airport that counts as a connection. */
export const MAX_CONNECTION_MINUTES = 24 * 60;

/** What Duffle has saved for a flight: local times as "YYYY-MM-DDTHH:mm". */
export type SavedFlight = {
  fromAirport: string;
  toAirport: string;
  departAt: string;
  arriveAt: string;
  fromTerminal: string | null;
  toTerminal: string | null;
  durationMinutes: number | null;
};

/** The leg in a fresh lookup that is this saved flight: same airports, departing closest to the saved time. */
export function findSavedLeg(legs: FlightMatch[], saved: SavedFlight) {
  let best: FlightMatch | null = null;
  let bestGap = Infinity;
  for (const leg of legs) {
    if (leg.fromAirport !== saved.fromAirport || leg.toAirport !== saved.toAirport) continue;
    const gap = Math.abs(minutesBetween(saved.departAt, leg.departAt));
    // A retimed flight moves by hours, not days; anything further away is another day's flight.
    if (gap <= 18 * 60 && gap < bestGap) {
      best = leg;
      bestGap = gap;
    }
  }
  return best;
}

export type FlightChange = {
  field: "departAt" | "arriveAt" | "fromTerminal" | "toTerminal";
  before: string;
  after: string;
};

/**
 * What the airline changed since the flight was saved. A terminal the lookup leaves out is not a change:
 * AeroDataBox often has none until near departure, and a terminal the traveler typed should stay.
 */
export function flightChanges(saved: SavedFlight, leg: FlightMatch): FlightChange[] {
  const changes: FlightChange[] = [];
  if (leg.departAt !== saved.departAt) changes.push({ field: "departAt", before: saved.departAt, after: leg.departAt });
  if (leg.arriveAt !== saved.arriveAt) changes.push({ field: "arriveAt", before: saved.arriveAt, after: leg.arriveAt });
  for (const field of ["fromTerminal", "toTerminal"] as const) {
    const after = leg[field].trim();
    const before = (saved[field] ?? "").trim();
    if (after && terminalLabel(after) !== terminalLabel(before)) changes.push({ field, before, after });
  }
  return changes;
}

/** "2026-11-10T11:30" → "Tue 10 Nov 11:30". */
function dayAndTime(local: string, locale: Locale) {
  const day = new Date(`${local.slice(0, 10)}T00:00:00Z`);
  // The test runner loads this file without path aliases, so it takes the language code as is.
  const date = day.toLocaleDateString(locale in CHANGE_TEXT && locale !== "en" ? locale : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${date} ${local.slice(11, 16)}`;
}

/** How a flight change reads in each language. {after} and {before} are times or terminals. */
const CHANGE_TEXT: Record<
  Locale,
  { departs: string; arrives: string; departsFrom: string; arrivesAt: string; instead: string }
> = {
  en: { departs: "Departs {after}", arrives: "Arrives {after}", departsFrom: "Departs from {after}", arrivesAt: "Arrives at {after}", instead: " instead of {before}" },
  he: { departs: "ממריאה ב-{after}", arrives: "נוחתת ב-{after}", departsFrom: "ממריאה מ{after}", arrivesAt: "נוחתת ב{after}", instead: " במקום {before}" },
  es: { departs: "Sale a las {after}", arrives: "Llega a las {after}", departsFrom: "Sale de la {after}", arrivesAt: "Llega a la {after}", instead: " en lugar de {before}" },
  fr: { departs: "Départ à {after}", arrives: "Arrivée à {after}", departsFrom: "Départ du {after}", arrivesAt: "Arrivée au {after}", instead: " au lieu de {before}" },
  de: { departs: "Abflug {after}", arrives: "Ankunft {after}", departsFrom: "Abflug von {after}", arrivesAt: "Ankunft an {after}", instead: " statt {before}" },
  ru: { departs: "Вылет в {after}", arrives: "Прилёт в {after}", departsFrom: "Вылет из: {after}", arrivesAt: "Прилёт в: {after}", instead: " вместо {before}" },
};

/** "Departs 11:30 instead of 11:00", "Departs from Terminal 2 instead of Terminal 1". */
export function describeChange(change: FlightChange, locale: Locale = "en") {
  // Also called as a .map() callback, where the second argument is an index.
  const text = CHANGE_TEXT[locale] ?? CHANGE_TEXT.en;
  const fill = (template: string, after: string, before: string) =>
    template.replace("{after}", after) + (before ? text.instead.replace("{before}", before) : "");
  if (change.field === "departAt" || change.field === "arriveAt") {
    const sameDay = change.before.slice(0, 10) === change.after.slice(0, 10);
    const after = sameDay ? change.after.slice(11, 16) : dayAndTime(change.after, locale);
    const before = sameDay ? change.before.slice(11, 16) : dayAndTime(change.before, locale);
    return fill(change.field === "departAt" ? text.departs : text.arrives, after, before);
  }
  return fill(
    change.field === "fromTerminal" ? text.departsFrom : text.arrivesAt,
    terminalLabel(change.after, locale),
    terminalLabel(change.before, locale),
  );
}

/**
 * How long until a saved flight should be checked again: often near departure, when gates and
 * terminals settle, and once a day before that.
 */
export function recheckAfterMinutes(minutesToDeparture: number) {
  if (minutesToDeparture <= 2 * 24 * 60) return 3 * 60;
  return 24 * 60;
}
