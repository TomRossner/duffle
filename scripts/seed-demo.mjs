import { hash } from "bcryptjs";
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const password = "password123";
const passwordHash = await hash(password, 12);

// Password sign-in requires a verified email, so demo users skip the confirmation step.
// They live in the US, which keeps the flight home from adding a US flag to trip titles.
async function upsertUser(name, email) {
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, emailVerified: new Date(), country: "US" },
    create: { name, email, passwordHash, emailVerified: new Date(), country: "US" },
  });
}

const alex = await upsertUser("Alex Rivera", "alex@example.com");
const sam = await upsertUser("Sam Chen", "sam@example.com");
const jordan = await upsertUser("Jordan Patel", "jordan@example.com");

async function ensureTrip({ name, owner, joinToken, startDate, endDate, coverNote, members }) {
  const existing = await prisma.trip.findUnique({ where: { joinToken } });
  if (existing) return existing;
  return prisma.trip.create({
    data: {
      name,
      startDate,
      endDate,
      baseCurrency: "USD",
      coverNote,
      ownerId: owner.id,
      joinToken,
      members: {
        create: members.map(([user, role, status]) => ({ userId: user.id, role, status })),
      },
    },
  });
}

// A finished trip and one that is always a month out, so both lists have something in them.
await ensureTrip({
  name: "Rome weekend",
  owner: alex,
  joinToken: "rome-weekend-demo-join-token",
  startDate: new Date(Date.UTC(2026, 9, 10)),
  endDate: new Date(Date.UTC(2026, 9, 14)),
  coverNote: "A short city break.",
  members: [
    [alex, "ADMIN", "ACCEPTED"],
    [sam, "MEMBER", "ACCEPTED"],
  ],
});

const today = new Date();
const lisbonStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 5));
const lisbonEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 11));
const lisbon = await ensureTrip({
  name: "Lisbon week",
  owner: sam,
  joinToken: "lisbon-week-demo-join-token",
  startDate: lisbonStart,
  endDate: lisbonEnd,
  coverNote: "Tiles, trams and pastéis de nata.",
  members: [
    [sam, "ADMIN", "ACCEPTED"],
    [alex, "MEMBER", "ACCEPTED"],
    [jordan, "MEMBER", "INVITED"],
  ],
});

function day(offset, hour = 0, minute = 0) {
  const start = lisbon.startDate;
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + offset, hour, minute));
}

// Demo rates are fixed so the seed works offline. The trip's base currency is USD.
const RATES = { USD: 1, EUR: 1.08 };

async function expense({ title, category, amount, currency = "EUR", date, paidBy, phase = "PLANNED", paid = false, split, notes }) {
  const participants = split ?? [alex, sam];
  const rate = RATES[currency];
  const cents = Math.round(amount * 100);
  const each = Math.floor(cents / participants.length);
  const remainder = cents - each * participants.length;
  return prisma.expense.create({
    data: {
      tripId: lisbon.id,
      phase,
      paid,
      category,
      title,
      amount,
      currency,
      fxRate: rate,
      fxDate: date,
      amountInBase: Math.round(amount * rate * 100) / 100,
      manualRate: currency !== "USD",
      date,
      notes,
      paidById: paidBy.id,
      splitType: "EQUAL",
      shares: {
        create: participants.map((user, index) => ({
          userId: user.id,
          amount: (each + (index < remainder ? 1 : 0)) / 100,
        })),
      },
    },
  });
}

async function seedLisbonDetails() {
  const tripId = lisbon.id;
  const travelers = [alex, sam];
  const destination = (data) => prisma.destination.create({ data: { tripId, ...data } });
  const lisbonCity = await destination({
    name: "Lisbon", lat: 38.7223, lng: -9.1393, address: "Lisbon, Portugal",
    startDate: day(0), endDate: day(3), notes: "Base in Alfama. Hilly, so bring good shoes.", sortOrder: 0,
  });
  const sintra = await destination({
    name: "Sintra", lat: 38.8029, lng: -9.3817, address: "Sintra, Portugal",
    startDate: day(3), endDate: day(4), notes: "Day trip by train from Rossio.", sortOrder: 1,
  });
  const porto = await destination({
    name: "Porto", lat: 41.1579, lng: -8.6291, address: "Porto, Portugal",
    startDate: day(4), endDate: day(6), notes: "Train up the coast, fly home from OPO.", sortOrder: 2,
  });

  // Flights, each with a planned cost.
  const outbound = await expense({ title: "JFK → LIS", category: "FLIGHT", amount: 1240, currency: "USD", date: day(0), paidBy: sam, paid: true });
  const home = await expense({ title: "OPO → JFK", category: "FLIGHT", amount: 1180, currency: "USD", date: day(6), paidBy: alex, paid: true });
  const flights = [
    { airline: "TAP Air Portugal", flightNumber: "TP202", fromAirport: "JFK", toAirport: "LIS", fromLat: 40.6413, fromLng: -73.7781, toLat: 38.7742, toLng: -9.1342, departAt: day(-1, 22, 30), arriveAt: day(0, 10, 15), confirmation: "TPX7Q2", expenseId: outbound.id },
    { airline: "TAP Air Portugal", flightNumber: "TP1205", fromAirport: "OPO", toAirport: "JFK", fromLat: 41.2481, fromLng: -8.6814, toLat: 40.6413, toLng: -73.7781, departAt: day(6, 11, 40), arriveAt: day(6, 15, 5), confirmation: "TPK4M9", expenseId: home.id },
  ];
  for (const flight of flights) {
    await prisma.flight.create({
      data: { tripId, ...flight, travelers: { create: travelers.map((user) => ({ userId: user.id })) } },
    });
  }

  // Stays.
  const alfama = await expense({ title: "Alfama apartment", category: "STAY", amount: 540, date: day(0), paidBy: sam, paid: true });
  const ribeira = await expense({ title: "Ribeira guesthouse", category: "STAY", amount: 310, date: day(4), paidBy: alex });
  await prisma.stay.create({
    data: {
      tripId, destinationId: lisbonCity.id, name: "Alfama apartment", address: "Rua de São Miguel 12, Lisbon",
      lat: 38.7116, lng: -9.1296, checkIn: day(0, 15), checkOut: day(4, 10), confirmation: "HM8842",
      notes: "Key box code arrives the day before.", expenseId: alfama.id,
    },
  });
  await prisma.stay.create({
    data: {
      tripId, destinationId: porto.id, name: "Ribeira guesthouse", address: "Cais da Ribeira 40, Porto",
      lat: 41.1405, lng: -8.6132, checkIn: day(4, 14), checkOut: day(6, 9), confirmation: "BK19203", expenseId: ribeira.id,
    },
  });

  // Activities, some with a planned cost.
  const activities = [
    { destination: lisbonCity, title: "Tram 28 ride", tags: ["CITY"], startAt: day(1, 10), endAt: day(1, 11, 30), lat: 38.7139, lng: -9.1334 },
    { destination: lisbonCity, title: "Belém Tower and Jerónimos", tags: ["CITY"], startAt: day(1, 14), endAt: day(1, 17), lat: 38.6916, lng: -9.216, cost: 36 },
    { destination: lisbonCity, title: "Cascais beach afternoon", tags: ["BEACH"], startAt: day(2, 12), endAt: day(2, 17), lat: 38.6979, lng: -9.4215 },
    { destination: lisbonCity, title: "Fado dinner in Alfama", tags: ["DINNER"], startAt: day(2, 20), endAt: day(2, 23), lat: 38.7112, lng: -9.1291, cost: 120 },
    { destination: sintra, title: "Pena Palace", tags: ["CITY", "HIKE"], startAt: day(3, 9, 30), endAt: day(3, 13), lat: 38.7876, lng: -9.3906, cost: 40 },
    { destination: sintra, title: "Hike to the Moorish Castle", tags: ["HIKE"], startAt: day(3, 14), endAt: day(3, 16, 30), lat: 38.7925, lng: -9.3893 },
    { destination: porto, title: "Livraria Lello", tags: ["CITY"], startAt: day(5, 10), endAt: day(5, 11), lat: 41.1469, lng: -8.6149, cost: 20 },
    { destination: porto, title: "Port cellar tasting", tags: ["DINNER", "CITY"], startAt: day(5, 15), endAt: day(5, 17), lat: 41.1373, lng: -8.6136, cost: 50 },
  ];
  for (const { destination: place, cost, ...activity } of activities) {
    const planned = cost
      ? await expense({ title: activity.title, category: "ACTIVITY", amount: cost, date: activity.startAt, paidBy: alex })
      : null;
    await prisma.activity.create({ data: { destinationId: place.id, ...activity, expenseId: planned?.id } });
  }

  // Schedule plans.
  await prisma.scheduleItem.createMany({
    data: [
      { tripId, title: "Airport transfer to Alfama", kind: "TRANSFER", startAt: day(0, 11), endAt: day(0, 11, 45), placeName: "Lisbon Airport", lat: 38.7742, lng: -9.1342 },
      { tripId, title: "Dinner at Time Out Market", kind: "DINNER", startAt: day(0, 19, 30), endAt: day(0, 21), placeName: "Time Out Market Lisboa", lat: 38.7069, lng: -9.1459 },
      { tripId, title: "Drinks with Inês", kind: "MEETUP", startAt: day(1, 18), endAt: day(1, 19, 30), placeName: "Miradouro da Senhora do Monte", lat: 38.7192, lng: -9.1325 },
      { tripId, title: "Train to Sintra", kind: "TRANSFER", startAt: day(3, 8, 11), endAt: day(3, 8, 50), placeName: "Rossio Station", lat: 38.7141, lng: -9.1408 },
      { tripId, title: "Train to Porto", kind: "TRANSFER", startAt: day(4, 9), endAt: day(4, 11, 49), placeName: "Santa Apolónia", lat: 38.7139, lng: -9.1225 },
      { tripId, title: "Francesinha dinner", kind: "DINNER", startAt: day(4, 20), endAt: day(4, 21, 30), placeName: "Café Santiago, Porto", lat: 41.1468, lng: -8.6074 },
      { tripId, title: "Pack and check out", kind: "OTHER", startAt: day(6), allDay: true },
    ],
  });

  // Money already spent on the ground.
  await expense({ title: "Viva Viagem cards", category: "TRANSPORT", amount: 22, date: day(0), paidBy: alex, phase: "ACTUAL", paid: true });
  await expense({ title: "Pastéis de Belém", category: "FOOD", amount: 14.4, date: day(1), paidBy: sam, phase: "ACTUAL", paid: true });
  await expense({ title: "Groceries", category: "FOOD", amount: 38.75, date: day(1), paidBy: alex, phase: "ACTUAL", paid: true });
  await expense({ title: "Sunglasses", category: "OTHER", amount: 45, date: day(2), paidBy: sam, phase: "ACTUAL", paid: true, split: [sam] });
  await expense({ title: "Train to Porto", category: "TRANSPORT", amount: 62.6, date: day(4), paidBy: sam, phase: "ACTUAL", paid: true });

  // Budget tables for comparing options before booking.
  const table = (data, rows) =>
    prisma.budgetTable.create({ data: { tripId, ...data, rows: { create: rows.map((row, sortOrder) => ({ ...row, sortOrder })) } } });
  await table({ title: "Flight options", kind: "FLIGHT", currency: "USD", sortOrder: 0 }, [
    { label: "TAP direct JFK → LIS", amount: 1240, note: "Booked", startDate: day(-1) },
    { label: "United via Newark", amount: 1105, note: "Red-eye, 1 stop", startDate: day(-1) },
    { label: "Azores Airlines via PDL", amount: 980, note: "6h layover", startDate: day(-1) },
  ]);
  await table({ title: "Porto lodging", kind: "LODGING", currency: "EUR", sortOrder: 1 }, [
    { label: "Ribeira guesthouse", amount: 310, note: "River view", startDate: day(4), endDate: day(6) },
    { label: "Boutique hotel, Baixa", amount: 420, startDate: day(4), endDate: day(6) },
    { label: "Hostel private room", amount: 160, note: "Shared bathroom", startDate: day(4), endDate: day(6) },
  ]);
  await table({ title: "Car for the coast", kind: "CAR", currency: "EUR", sortOrder: 2 }, [
    { label: "Europcar compact, 2 days", amount: 95, startDate: day(3), endDate: day(4) },
    { label: "Sixt SUV, 2 days", amount: 150, startDate: day(3), endDate: day(4) },
  ]);
}

// Trip contents are only added once, so edits made in the app survive a reseed.
if ((await prisma.destination.count({ where: { tripId: lisbon.id } })) === 0) {
  await seedLisbonDetails();
}

async function sessionCookie(user) {
  const token = await encode({
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionVersion: user.sessionVersion,
    },
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
  });
  return `authjs.session-token=${token}`;
}

writeFileSync(".alex.cookie", await sessionCookie(alex));
writeFileSync(".sam.cookie", await sessionCookie(sam));
writeFileSync(".jordan.cookie", await sessionCookie(jordan));
console.log(`Seeded alex@, sam@ and jordan@example.com (password: ${password}). Cookies written for local checks.`);
await prisma.$disconnect();
