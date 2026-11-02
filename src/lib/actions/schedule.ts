"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { SCHEDULE_KINDS } from "@/lib/constants";
import { asDateOnly, parseDateTime } from "@/lib/dates";
import { createSimplePlannedExpense, deleteExpenseById } from "@/lib/expenses";
import { geocodeAddress } from "@/lib/places";
import { prisma } from "@/lib/prisma";
import { notifyTrip } from "@/lib/notify";
import { planSeries, readScheduleWhen, repeatTimes } from "@/lib/schedule-when";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

async function optionalCost(
  tripId: string,
  userId: string,
  title: string,
  category: "FLIGHT" | "STAY",
  date: Date,
  formData: FormData,
  notes: string | null,
) {
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!amountRaw) return { expenseId: undefined as string | undefined };
  const members = await acceptedMembers(tripId);
  const manualRaw = String(formData.get("manualRate") ?? "").trim();
  const created = await createSimplePlannedExpense({
    tripId,
    title,
    category,
    amount: Number(amountRaw),
    currency: String(formData.get("currency") ?? "").toUpperCase(),
    date: asDateOnly(date),
    paidById: userId,
    memberIds: members.map((member) => member.userId),
    manualRate: manualRaw ? Number(manualRaw) : null,
    notes,
  });
  if ("error" in created) return created;
  return { expenseId: created.expense.id };
}

function readFlightInput(formData: FormData) {
  const airline = String(formData.get("airline") ?? "").trim();
  const flightNumber = String(formData.get("flightNumber") ?? "").trim();
  const fromAirport = String(formData.get("fromAirport") ?? "").trim();
  const toAirport = String(formData.get("toAirport") ?? "").trim();
  const departAt = parseDateTime(String(formData.get("departAt") ?? "").slice(0, 16));
  const arriveAt = parseDateTime(String(formData.get("arriveAt") ?? "").slice(0, 16));
  const confirmation = String(formData.get("confirmation") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!airline || !flightNumber || !fromAirport || !toAirport) {
    return { error: "Airline, flight number, and both airports are required." };
  }
  if (!departAt || !arriveAt) return { error: "Choose a departure and arrival date and time." };
  if (arriveAt < departAt) return { error: "Arrival must be after departure." };

  return { airline, flightNumber, fromAirport, toAirport, departAt, arriveAt, confirmation, notes };
}

async function travelerIds(tripId: string, formData: FormData) {
  const members = await acceptedMembers(tripId);
  const memberIds = new Set(members.map((member) => member.userId));
  return formData
    .getAll("traveler")
    .map(String)
    .filter((id) => memberIds.has(id));
}

export async function createFlight(tripId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const parsed = readFlightInput(formData);
  if ("error" in parsed) return parsed;
  const travelers = await travelerIds(tripId, formData);
  if (travelers.length === 0) return { error: "Choose at least one traveler." };
  const { airline, flightNumber, fromAirport, toAirport, departAt, arriveAt, confirmation, notes } = parsed;

  const [fromPoint, toPoint] = await Promise.all([
    geocodeAddress(`${fromAirport} airport`),
    geocodeAddress(`${toAirport} airport`),
  ]);

  const cost = await optionalCost(
    tripId,
    user.id,
    `${airline} ${flightNumber}`,
    "FLIGHT",
    departAt,
    formData,
    notes,
  );
  if ("error" in cost) return cost;

  await prisma.flight.create({
    data: {
      tripId,
      airline,
      flightNumber,
      fromAirport,
      toAirport,
      fromLat: fromPoint?.lat,
      fromLng: fromPoint?.lng,
      toLat: toPoint?.lat,
      toLng: toPoint?.lng,
      departAt,
      arriveAt,
      confirmation,
      notes,
      expenseId: cost.expenseId,
      travelers: { create: travelers.map((userId) => ({ userId })) },
    },
  });

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "FLIGHT",
    title: "Flight added",
    body: `${user.name ?? "A traveler"} added ${airline} ${flightNumber}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function updateFlight(tripId: string, flightId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const flight = await prisma.flight.findFirst({ where: { id: flightId, tripId } });
  if (!flight) return { error: "Flight not found." };
  const parsed = readFlightInput(formData);
  if ("error" in parsed) return parsed;
  const travelers = await travelerIds(tripId, formData);
  if (travelers.length === 0) return { error: "Choose at least one traveler." };

  const { airline, flightNumber, fromAirport, toAirport, departAt, arriveAt, confirmation, notes } = parsed;
  let fromLat = flight.fromLat;
  let fromLng = flight.fromLng;
  let toLat = flight.toLat;
  let toLng = flight.toLng;
  if (fromAirport !== flight.fromAirport || toAirport !== flight.toAirport) {
    const [fromPoint, toPoint] = await Promise.all([
      fromAirport === flight.fromAirport ? null : geocodeAddress(`${fromAirport} airport`),
      toAirport === flight.toAirport ? null : geocodeAddress(`${toAirport} airport`),
    ]);
    if (fromAirport !== flight.fromAirport) {
      fromLat = fromPoint?.lat ?? null;
      fromLng = fromPoint?.lng ?? null;
    }
    if (toAirport !== flight.toAirport) {
      toLat = toPoint?.lat ?? null;
      toLng = toPoint?.lng ?? null;
    }
  }

  await prisma.flight.update({
    where: { id: flightId },
    data: {
      airline,
      flightNumber,
      fromAirport,
      toAirport,
      fromLat,
      fromLng,
      toLat,
      toLng,
      departAt,
      arriveAt,
      confirmation,
      notes,
      travelers: {
        deleteMany: {},
        create: travelers.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/schedule`);
  await notifyTrip(tripId, user.id, {
    kind: "FLIGHT",
    title: "Flight updated",
    body: `${user.name ?? "A traveler"} updated ${airline} ${flightNumber}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function createPlan(tripId: string, state: unknown, formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  if (kind === "FLIGHT") return createFlight(tripId, state, formData);
  if (kind === "STAY") return createStay(tripId, state, formData);
  return createScheduleItem(tripId, state, formData);
}

export async function deleteFlight(tripId: string, flightId: string) {
  const { user } = await requireTrip(tripId);
  const flight = await prisma.flight.findFirst({ where: { id: flightId, tripId } });
  if (!flight) return { error: "Flight not found." };
  await prisma.flight.delete({ where: { id: flightId } });
  await deleteExpenseById(flight.expenseId);
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "FLIGHT",
    title: "Flight removed",
    body: `${user.name ?? "A traveler"} removed ${flight.airline} ${flight.flightNumber}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function createStay(tripId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const destinationId = String(formData.get("destinationId") ?? "") || null;
  const checkIn = parseDateTime(String(formData.get("checkIn") ?? "").slice(0, 16));
  const checkOut = parseDateTime(String(formData.get("checkOut") ?? "").slice(0, 16));
  const confirmation = String(formData.get("confirmation") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Name the stay." };
  if (!checkIn || !checkOut) return { error: "Choose check-in and check-out dates and times." };
  if (checkOut <= checkIn) return { error: "Check-out must be after check-in." };

  if (destinationId) {
    const destination = await prisma.destination.findFirst({ where: { id: destinationId, tripId } });
    if (!destination) return { error: "That destination is not on this trip." };
  }

  const point = address ? await geocodeAddress(address) : null;
  const cost = await optionalCost(tripId, user.id, name, "STAY", checkIn, formData, notes);
  if ("error" in cost) return cost;

  await prisma.stay.create({
    data: {
      tripId,
      destinationId,
      name,
      address,
      lat: point?.lat,
      lng: point?.lng,
      checkIn,
      checkOut,
      confirmation,
      notes,
      expenseId: cost.expenseId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "STAY",
    title: "Stay added",
    body: `${user.name ?? "A traveler"} added ${name}.`,
    href: `/trips/${tripId}/stays`,
  });
  return { ok: true };
}

export async function updateStay(tripId: string, stayId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const stay = await prisma.stay.findFirst({ where: { id: stayId, tripId } });
  if (!stay) return { error: "Stay not found." };

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const destinationId = String(formData.get("destinationId") ?? "") || null;
  const checkIn = parseDateTime(String(formData.get("checkIn") ?? "").slice(0, 16));
  const checkOut = parseDateTime(String(formData.get("checkOut") ?? "").slice(0, 16));
  const confirmation = String(formData.get("confirmation") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Name the stay." };
  if (!checkIn || !checkOut) return { error: "Choose check-in and check-out dates and times." };
  if (checkOut <= checkIn) return { error: "Check-out must be after check-in." };

  if (destinationId) {
    const destination = await prisma.destination.findFirst({ where: { id: destinationId, tripId } });
    if (!destination) return { error: "That destination is not on this trip." };
  }

  const point = address && address !== stay.address ? await geocodeAddress(address) : null;

  await prisma.stay.update({
    where: { id: stayId },
    data: {
      name,
      address,
      destinationId,
      checkIn,
      checkOut,
      confirmation,
      notes,
      lat: address ? (point?.lat ?? stay.lat) : null,
      lng: address ? (point?.lng ?? stay.lng) : null,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "STAY",
    title: "Stay updated",
    body: `${user.name ?? "A traveler"} updated ${name}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function deleteStay(tripId: string, stayId: string) {
  const { user } = await requireTrip(tripId);
  const stay = await prisma.stay.findFirst({ where: { id: stayId, tripId } });
  if (!stay) return { error: "Stay not found." };
  await prisma.stay.delete({ where: { id: stayId } });
  await deleteExpenseById(stay.expenseId);
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "STAY",
    title: "Stay removed",
    body: `${user.name ?? "A traveler"} removed ${stay.name}.`,
    href: `/trips/${tripId}/stays`,
  });
  return { ok: true };
}

function onDays(count: number) {
  return count === 1 ? "" : ` on ${count} days`;
}

export async function createScheduleItem(tripId: string, _: unknown, formData: FormData) {
  const { user, trip } = await requireTrip(tripId);
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const placeName = String(formData.get("placeName") ?? "").trim() || null;

  if (!title) return { error: "Name the plan." };
  if (!SCHEDULE_KINDS.includes(kind as (typeof SCHEDULE_KINDS)[number])) return { error: "Choose a kind." };
  const when = readScheduleWhen(formData, trip);
  if ("error" in when) return when;
  if ("empty" in when) return { error: "Choose a start time." };

  let lat: number | undefined;
  let lng: number | undefined;
  if (placeName) {
    const point = await geocodeAddress(placeName);
    lat = point?.lat;
    lng = point?.lng;
  }

  const times = [{ startAt: when.startAt, endAt: when.endAt }, ...repeatTimes(when)];
  // Copies share a series id so the edit form can show and manage all their days together.
  const seriesId = times.length > 1 ? randomUUID() : null;
  await prisma.scheduleItem.createMany({
    data: times.map(({ startAt, endAt }) => ({
      tripId,
      title,
      kind,
      startAt,
      endAt,
      allDay: when.allDay,
      seriesId,
      notes,
      placeName,
      lat,
      lng,
    })),
  });
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "SCHEDULE",
    title: "Schedule updated",
    body: `${user.name ?? "A traveler"} added ${title}${onDays(times.length)}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function updateScheduleItem(tripId: string, itemId: string, _: unknown, formData: FormData) {
  const { user, trip } = await requireTrip(tripId);
  const item = await prisma.scheduleItem.findFirst({ where: { id: itemId, tripId } });
  if (!item) return { error: "Plan not found." };

  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const placeName = String(formData.get("placeName") ?? "").trim() || null;

  if (!title) return { error: "Name the plan." };
  if (!SCHEDULE_KINDS.includes(kind as (typeof SCHEDULE_KINDS)[number])) return { error: "Choose a kind." };
  const when = readScheduleWhen(formData, trip);
  if ("error" in when) return when;
  if ("empty" in when) return { error: "Choose a start time." };
  const { allDay } = when;

  let lat: number | null = item.lat;
  let lng: number | null = item.lng;
  if (placeName && placeName !== item.placeName) {
    const point = await geocodeAddress(placeName);
    lat = point?.lat ?? null;
    lng = point?.lng ?? null;
  }
  if (!placeName) {
    lat = null;
    lng = null;
  }

  // The form's days describe the whole series, so edits apply to every day of it.
  const members = item.seriesId
    ? await prisma.scheduleItem.findMany({ where: { tripId, seriesId: item.seriesId }, select: { id: true, startAt: true } })
    : [item];
  const plan = planSeries(when, item.id, members);
  const seriesId = item.seriesId ?? (plan.create.length > 0 ? randomUUID() : null);
  const shared = { title, kind, allDay, notes, placeName, lat, lng, seriesId };

  await prisma.$transaction([
    ...plan.update.map(({ id, startAt, endAt }) =>
      prisma.scheduleItem.update({ where: { id }, data: { ...shared, startAt, endAt } }),
    ),
    prisma.scheduleItem.deleteMany({ where: { tripId, id: { in: plan.remove } } }),
    prisma.scheduleItem.createMany({ data: plan.create.map((timing) => ({ tripId, ...shared, ...timing })) }),
  ]);
  revalidatePath(`/trips/${tripId}`);
  const days = plan.update.length + plan.create.length;
  await notifyTrip(tripId, user.id, {
    kind: "SCHEDULE",
    title: "Schedule updated",
    body: `${user.name ?? "A traveler"} updated ${title}${onDays(days)}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}

export async function deleteScheduleItem(tripId: string, itemId: string) {
  const { user } = await requireTrip(tripId);
  const item = await prisma.scheduleItem.findFirst({ where: { id: itemId, tripId } });
  if (!item) return { error: "Plan not found." };
  await prisma.scheduleItem.delete({ where: { id: itemId } });
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "SCHEDULE",
    title: "Schedule updated",
    body: `${user.name ?? "A traveler"} removed ${item.title}.`,
    href: `/trips/${tripId}/schedule`,
  });
  return { ok: true };
}
