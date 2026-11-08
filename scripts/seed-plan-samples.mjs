// Adds one or more sample plans of every kind to the "Lisbon week" demo trip, dated from the trip's
// current start date, so the schedule's detail dialogs can be checked with full and sparse data.
//
//   node scripts/seed-plan-samples.mjs           add (or refresh) the samples
//   node scripts/seed-plan-samples.mjs --remove  take them out again
//
// Samples are matched by title, so running it again replaces them instead of adding copies.
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const remove = process.argv.includes("--remove");

const trip = await prisma.trip.findUnique({ where: { joinToken: "lisbon-week-demo-join-token" } });
if (!trip) {
  console.error('No "Lisbon week" trip. Run scripts/seed-demo.mjs first.');
  process.exit(1);
}
const tripId = trip.id;
const [alex, sam] = await Promise.all(
  ["alex@example.com", "sam@example.com"].map((email) => prisma.user.findUniqueOrThrow({ where: { email } })),
);

function day(offset, hour = 0, minute = 0) {
  const start = trip.startDate;
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + offset, hour, minute));
}

const FLIGHTS = ["TP1689", "TP1940"];
const STAYS = ["Memmo Alfama Hotel", "Sintra garden cottage"];
const ITEMS = [
  "Uber to Memmo Alfama",
  "Buy a SIM card",
  "Breakfast at Manteigaria",
  "Dinner at Cervejaria Ramiro",
  "Coffee with Marta",
  "Laundry day",
];
const ACTIVITIES = ["Oceanário de Lisboa", "Surf lesson at Carcavelos", "Sintra palaces day"];

async function clear() {
  const flights = await prisma.flight.findMany({ where: { tripId, flightNumber: { in: FLIGHTS } } });
  const stays = await prisma.stay.findMany({ where: { tripId, name: { in: STAYS } } });
  const activities = await prisma.activity.findMany({ where: { destination: { tripId }, title: { in: ACTIVITIES } } });
  const expenseIds = [...flights, ...stays, ...activities].map((row) => row.expenseId).filter(Boolean);
  await prisma.flight.deleteMany({ where: { id: { in: flights.map((row) => row.id) } } });
  await prisma.stay.deleteMany({ where: { id: { in: stays.map((row) => row.id) } } });
  await prisma.activity.deleteMany({ where: { id: { in: activities.map((row) => row.id) } } });
  await prisma.scheduleItem.deleteMany({ where: { tripId, title: { in: ITEMS } } });
  await prisma.expense.deleteMany({ where: { id: { in: expenseIds } } });
}

const RATES = { USD: 1, EUR: 1.08 };

async function expense({ title, category, amount, currency = "EUR", date, paidBy }) {
  const participants = [alex, sam];
  const cents = Math.round(amount * 100);
  const each = Math.floor(cents / participants.length);
  const remainder = cents - each * participants.length;
  return prisma.expense.create({
    data: {
      tripId,
      phase: "PLANNED",
      paid: true,
      category,
      title,
      amount,
      currency,
      fxRate: RATES[currency],
      fxDate: date,
      amountInBase: Math.round(amount * RATES[currency] * 100) / 100,
      manualRate: currency !== "USD",
      date,
      paidById: paidBy.id,
      splitType: "EQUAL",
      shares: {
        create: participants.map((user, index) => ({ userId: user.id, amount: (each + (index < remainder ? 1 : 0)) / 100 })),
      },
    },
  });
}

await clear();

if (remove) {
  console.log("Removed the sample plans from Lisbon week.");
  await prisma.$disconnect();
  process.exit(0);
}

// Flights: one with every detail, one with only the basics.
const madeiraCost = await expense({ title: "LIS → FNC", category: "FLIGHT", amount: 168, date: day(6), paidBy: sam });
await prisma.flight.create({
  data: {
    tripId, airline: "TAP Air Portugal", flightNumber: "TP1689", fromAirport: "LIS", toAirport: "FNC",
    fromLat: 38.7742, fromLng: -9.1342, toLat: 32.6979, toLng: -16.7745, fromTerminal: "1", toTerminal: null,
    durationMinutes: 110, departAt: day(6, 12, 30), arriveAt: day(6, 14, 20), checkedAt: new Date(),
    confirmation: "TQ8R4L", seats: "14A, 14B", notes: "Window and middle on the left side.\nOne checked bag each is included.",
    expenseId: madeiraCost.id, travelers: { create: [alex, sam].map((user) => ({ userId: user.id })) },
  },
});
await prisma.flight.create({
  data: {
    tripId, airline: "TAP Air Portugal", flightNumber: "TP1940", fromAirport: "FNC", toAirport: "PXO",
    fromLat: 32.6979, fromLng: -16.7745, toLat: 33.0734, toLng: -16.35, departAt: day(7, 8, 5), arriveAt: day(7, 8, 30),
  },
});

// Stays: a fully filled hotel and a bare cottage.
const lisbonCity = await prisma.destination.findFirst({ where: { tripId, name: "Lisbon" } });
const sintra = await prisma.destination.findFirst({ where: { tripId, name: "Sintra" } });
const hotelCost = await expense({ title: "Memmo Alfama Hotel", category: "STAY", amount: 640, date: day(0), paidBy: alex });
await prisma.stay.create({
  data: {
    tripId, destinationId: lisbonCity?.id, name: "Memmo Alfama Hotel", address: "Travessa das Merceeiras 27, 1100-348 Lisbon",
    lat: 38.7108, lng: -9.1312, checkIn: day(0, 15), checkOut: day(4, 11), confirmation: "MEM-55120",
    notes: "Breakfast included, 7:30–10:30.\nAsk for a room with a terrace view.", expenseId: hotelCost.id,
  },
});
await prisma.stay.create({
  data: { tripId, destinationId: sintra?.id, name: "Sintra garden cottage", checkIn: day(4, 16), checkOut: day(6, 8) },
});

// Schedule plans: each kind, a repeating one, an all-day one, and one with nothing but a title and time.
const breakfast = randomUUID();
await prisma.scheduleItem.createMany({
  data: [
    {
      tripId, title: "Uber to Memmo Alfama", kind: "TRANSFER", startAt: day(0, 17, 30), endAt: day(0, 18, 10),
      placeName: "Humberto Delgado Airport", lat: 38.7742, lng: -9.1342, notes: "Pickup at Arrivals, door 3. About €18.",
    },
    { tripId, title: "Buy a SIM card", kind: "OTHER", startAt: day(0, 19) },
    ...[1, 2, 3].map((offset) => ({
      tripId, title: "Breakfast at Manteigaria", kind: "DINNER", startAt: day(offset, 8, 30), endAt: day(offset, 9),
      seriesId: breakfast, placeName: "Manteigaria, Rua do Loreto 2", lat: 38.7105, lng: -9.1445,
      notes: "Pastéis de nata straight from the oven.",
    })),
    {
      tripId, title: "Dinner at Cervejaria Ramiro", kind: "DINNER", startAt: day(1, 20), endAt: day(1, 22),
      placeName: "Cervejaria Ramiro", lat: 38.7206, lng: -9.1356,
      notes: "No reservations, so get there early.\nOrder the garlic prawns and finish with a prego.",
    },
    {
      tripId, title: "Coffee with Marta", kind: "MEETUP", startAt: day(2, 10, 30),
      placeName: "Café A Brasileira", lat: 38.7107, lng: -9.1424, notes: "She'll bring the guidebook she promised.",
    },
    { tripId, title: "Laundry day", kind: "OTHER", startAt: day(3), allDay: true, notes: "Laundromat two streets from the hotel." },
  ],
});

// Destination activities: with a cost and tags, a multi-tag one, and an all-day one.
if (lisbonCity) {
  const oceanarium = await expense({ title: "Oceanário de Lisboa", category: "ACTIVITY", amount: 50, date: day(1), paidBy: sam });
  await prisma.activity.create({
    data: {
      destinationId: lisbonCity.id, title: "Oceanário de Lisboa", tags: ["CITY"], startAt: day(1, 10), endAt: day(1, 13),
      lat: 38.7636, lng: -9.0937, expenseId: oceanarium.id, notes: "Tickets are on Sam's phone. The sea otters feed at 11:30.",
    },
  });
  await prisma.activity.create({
    data: {
      destinationId: lisbonCity.id, title: "Surf lesson at Carcavelos", tags: ["BEACH", "SPORT"],
      startAt: day(2, 14), endAt: day(2, 16, 30), lat: 38.6794, lng: -9.3355,
      notes: "Wetsuits provided. Bring a towel and sunscreen.",
    },
  });
}
if (sintra) {
  await prisma.activity.create({
    data: { destinationId: sintra.id, title: "Sintra palaces day", tags: ["HIKE", "CITY"], startAt: day(5), allDay: true },
  });
}

console.log(`Added sample plans to Lisbon week (${trip.startDate.toISOString().slice(0, 10)} onward).`);
await prisma.$disconnect();
