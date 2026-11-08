import assert from "node:assert/strict";
import test from "node:test";
import {
  airlineCodeOf,
  airportCodeOf,
  describeChange,
  findSavedLeg,
  flightChanges,
  recheckAfterMinutes,
  dayOffset,
  formatMinutes,
  journeyRoute,
  journeysOnDate,
  normalizeFlightNumber,
  normalizeSeats,
  seatList,
  parseFlights,
  terminalLabel,
} from "./flight-lookup.ts";

test("normalizeFlightNumber accepts common spellings", () => {
  assert.equal(normalizeFlightNumber("lh 400"), "LH400");
  assert.equal(normalizeFlightNumber("LH-0400"), "LH400");
  assert.equal(normalizeFlightNumber("u2 8123"), "U28123");
  assert.equal(normalizeFlightNumber("EZY1234"), "EZY1234");
  assert.equal(normalizeFlightNumber("1234"), null);
  assert.equal(normalizeFlightNumber("Lufthansa"), null);
});

test("parseFlights reads airports, terminals, and local times", () => {
  const matches = parseFlights([
    {
      number: "LH 400",
      codeshareStatus: "IsOperator",
      airline: { name: "Lufthansa", iata: "LH" },
      departure: {
        airport: { iata: "FRA", name: "Frankfurt-am-Main", municipalityName: "Frankfurt" },
        scheduledTime: { utc: "2026-11-10 12:55Z", local: "2026-11-10 13:55+01:00" },
        terminal: "1",
      },
      arrival: {
        airport: { iata: "JFK", name: "New York John F Kennedy", municipalityName: "New York" },
        scheduledTime: { utc: "2026-11-10 21:40Z", local: "2026-11-10 16:40-05:00" },
      },
    },
  ]);
  assert.deepEqual(matches, [
    {
      airline: "Lufthansa",
      flightNumber: "LH400",
      fromAirport: "FRA",
      fromName: "Frankfurt-am-Main",
      fromTerminal: "1",
      toAirport: "JFK",
      toName: "New York John F Kennedy",
      toTerminal: "",
      departAt: "2026-11-10T13:55",
      arriveAt: "2026-11-10T16:40",
      // 12:55Z to 21:40Z. The local times alone (13:55 to 16:40) would say 2h 45m.
      durationMinutes: 525,
      codeshare: false,
    },
  ]);
});

test("parseFlights takes the duration from UTC or offset times, and only those", () => {
  const flight = (departure: object, arrival: object) => ({
    number: "LH 400",
    departure: { airport: { iata: "FRA" }, scheduledTime: departure },
    arrival: { airport: { iata: "JFK" }, scheduledTime: arrival },
  });
  const minutes = (departure: object, arrival: object) => parseFlights([flight(departure, arrival)])[0].durationMinutes;
  assert.equal(minutes({ local: "2026-11-10 11:00+01:00" }, { local: "2026-11-10 13:35-05:00" }), 515);
  assert.equal(minutes({ local: "2026-11-10 11:00" }, { local: "2026-11-10 13:35" }), null);
  // Westbound over the date line: lands "before" it leaves, locally, after 9h 50m in the air.
  assert.equal(
    minutes({ utc: "2026-11-10 09:00Z", local: "2026-11-10 18:00+09:00" }, { utc: "2026-11-10 18:50Z", local: "2026-11-10 10:50-08:00" }),
    590,
  );
});

test("parseFlights sorts legs and drops incomplete and duplicate entries", () => {
  const leg = (from: string, to: string, depart: string, arrive: string) => ({
    number: "QF 1",
    airline: { name: "Qantas" },
    departure: { airport: { iata: from }, scheduledTime: { local: `${depart}+00:00` } },
    arrival: { airport: { iata: to }, scheduledTime: { local: `${arrive}+00:00` } },
  });
  const matches = parseFlights([
    leg("SIN", "LHR", "2026-11-11 00:10", "2026-11-11 06:50"),
    leg("SYD", "SIN", "2026-11-10 16:35", "2026-11-10 22:40"),
    leg("SYD", "SIN", "2026-11-10 16:35", "2026-11-10 22:40"),
    { number: "QF 1", departure: { airport: { iata: "SYD" } } },
  ]);
  assert.deepEqual(
    matches.map((match) => `${match.fromAirport}-${match.toAirport}`),
    ["SYD-SIN", "SIN-LHR"],
  );
  assert.deepEqual(parseFlights({ message: "error" }), []);
});

const route = (journeys: ReturnType<typeof journeysOnDate>) =>
  journeys.map((journey) => `${journey[0].flightNumber} ${journeyRoute(journey)}`);

test("journeysOnDate follows a flight number through its stop, onto the next day", () => {
  const leg = (from: string, to: string, depart: string, arrive: string) => ({
    number: "QF 1",
    airline: { name: "Qantas" },
    departure: { airport: { iata: from }, scheduledTime: { local: `${depart}+00:00` } },
    arrival: { airport: { iata: to }, scheduledTime: { local: `${arrive}+00:00` } },
  });
  // As AeroDataBox answered for QF1 on 2026-11-10 with dateLocalRole=Both: yesterday's SIN–LHR leg
  // lands today, today's SYD–SIN leg, and its SIN–LHR continuation.
  const legs = parseFlights([
    leg("SIN", "LHR", "2026-11-09 23:35", "2026-11-10 06:15"),
    leg("SYD", "SIN", "2026-11-10 16:30", "2026-11-10 21:35"),
    leg("SIN", "LHR", "2026-11-10 23:35", "2026-11-11 06:15"),
  ]);
  assert.deepEqual(route(journeysOnDate(legs, "2026-11-10")), ["QF1 SYD → SIN → LHR"]);
  // A lookup on the day of the SIN–LHR leg finds that leg alone.
  assert.deepEqual(route(journeysOnDate(legs, "2026-11-09")), ["QF1 SIN → LHR"]);
});

test("journeysOnDate keeps a long gap or another number as separate flights", () => {
  const leg = (number: string, from: string, to: string, depart: string, arrive: string) => ({
    number,
    departure: { airport: { iata: from }, scheduledTime: { local: `${depart}+00:00` } },
    arrival: { airport: { iata: to }, scheduledTime: { local: `${arrive}+00:00` } },
  });
  const legs = parseFlights([
    leg("LH 400", "FRA", "JFK", "2026-11-10 10:00", "2026-11-10 13:00"),
    leg("LH 400", "FRA", "JFK", "2026-11-10 22:00", "2026-11-11 01:00"),
    leg("LH 401", "JFK", "FRA", "2026-11-10 15:00", "2026-11-11 05:00"),
  ]);
  assert.deepEqual(route(journeysOnDate(legs, "2026-11-10")), [
    "LH400 FRA → JFK",
    "LH401 JFK → FRA",
    "LH400 FRA → JFK",
  ]);
});

test("airportCodeOf reads the code from an airport field", () => {
  assert.equal(airportCodeOf("TLV · Ben Gurion International Airport"), "TLV");
  assert.equal(airportCodeOf(" muc "), "MUC");
  assert.equal(airportCodeOf("EGLL"), "EGLL");
  assert.equal(airportCodeOf("Somewhere else"), "Somewhere else");
});

test("flight labels", () => {
  assert.equal(journeyRoute([]), "");
  assert.equal(terminalLabel("1"), "Terminal 1");
  assert.equal(terminalLabel("2e"), "Terminal 2E");
  assert.equal(terminalLabel("B"), "Terminal B");
  assert.equal(terminalLabel("T1"), "Terminal 1");
  assert.equal(terminalLabel("Terminal 3"), "Terminal 3");
  assert.equal(terminalLabel(null), "");
  assert.equal(dayOffset("2026-11-10T16:35", "2026-11-11T06:50"), 1);
  assert.equal(dayOffset("2026-12-31T23:00", "2027-01-01T01:00"), 1);
  assert.equal(dayOffset("2026-11-10T08:00", "2026-11-09T22:00"), -1);
  assert.equal(formatMinutes(95), "1h 35m");
  assert.equal(formatMinutes(45), "45m");
  assert.equal(formatMinutes(180), "3h");
});

const savedLH400 = {
  fromAirport: "FRA",
  toAirport: "JFK",
  departAt: "2026-11-10T11:00",
  arriveAt: "2026-11-10T13:35",
  fromTerminal: "1",
  toTerminal: null,
  durationMinutes: 515,
};

const lookedUp = (changes: Partial<ReturnType<typeof parseFlights>[number]> = {}) => ({
  airline: "Lufthansa",
  flightNumber: "LH400",
  fromAirport: "FRA",
  fromName: "",
  fromTerminal: "1",
  toAirport: "JFK",
  toName: "",
  toTerminal: "",
  departAt: "2026-11-10T11:00",
  arriveAt: "2026-11-10T13:35",
  durationMinutes: 515,
  codeshare: false,
  ...changes,
});

test("findSavedLeg matches the same airports nearest the saved departure", () => {
  const retimed = lookedUp({ departAt: "2026-11-10T11:30" });
  const nextDay = lookedUp({ departAt: "2026-11-11T11:00" });
  const otherRoute = lookedUp({ fromAirport: "MUC" });
  assert.equal(findSavedLeg([nextDay, otherRoute, retimed], savedLH400), retimed);
  assert.equal(findSavedLeg([nextDay, otherRoute], savedLH400), null);
});

test("flightChanges reports retimes and new terminals, not missing ones", () => {
  assert.deepEqual(flightChanges(savedLH400, lookedUp()), []);
  // The lookup leaving out a terminal the traveler saved is not a change.
  assert.deepEqual(flightChanges(savedLH400, lookedUp({ fromTerminal: "" })), []);
  // "T1" and "1" are the same terminal.
  assert.deepEqual(flightChanges(savedLH400, lookedUp({ fromTerminal: "T1" })), []);
  const changes = flightChanges(
    savedLH400,
    lookedUp({ departAt: "2026-11-10T11:30", arriveAt: "2026-11-11T00:10", fromTerminal: "2", toTerminal: "4" }),
  );
  assert.deepEqual(changes.map(describeChange), [
    "Departs 11:30 instead of 11:00",
    "Arrives Wed 11 Nov 00:10 instead of Tue 10 Nov 13:35",
    "Departs from Terminal 2 instead of Terminal 1",
    "Arrives at Terminal 4",
  ]);
});

test("recheckAfterMinutes checks more often near departure", () => {
  assert.equal(recheckAfterMinutes(60), 180);
  assert.equal(recheckAfterMinutes(10 * 24 * 60), 24 * 60);
});

test("airlineCodeOf reads the IATA prefix", () => {
  assert.equal(airlineCodeOf("LH400"), "LH");
  assert.equal(airlineCodeOf("u2 8123"), "U2");
  assert.equal(airlineCodeOf("EZY1234"), null);
  assert.equal(airlineCodeOf("Lufthansa"), null);
});

test("normalizeSeats tidies typed seat numbers", () => {
  assert.deepEqual(normalizeSeats("14a 14b"), { seats: "14A, 14B" });
  assert.deepEqual(normalizeSeats(" 14A,14B; 15c / 14a "), { seats: "14A, 14B, 15C" });
  assert.deepEqual(normalizeSeats("   "), { seats: null });
  assert.ok("error" in normalizeSeats("window seat please"));
  assert.ok("error" in normalizeSeats("1A 2A 3A 4A 5A 6A 7A 8A 9A 10A"));
  assert.deepEqual(seatList("14A, 14B"), ["14A", "14B"]);
  assert.deepEqual(seatList(null), []);
});
