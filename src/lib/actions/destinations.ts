"use server";

import { revalidatePath } from "next/cache";
import { ACTIVITY_TAGS } from "@/lib/constants";
import { parseDate, parseDateTime } from "@/lib/dates";
import { createSimplePlannedExpense, deleteExpenseById } from "@/lib/expenses";
import { searchPlaces } from "@/lib/places";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, currentUser, requireTrip } from "@/lib/trip-access";

export async function searchPlacesAction(query: string) {
  const user = await currentUser();
  if (!user) return { error: "Sign in to search places.", results: [] };
  if (!query.trim()) return { results: [] };
  return searchPlaces(query.trim());
}

function readDestination(trip: { startDate: Date; endDate: Date }, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const placeId = String(formData.get("placeId") ?? "").trim() || null;
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Name the destination." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "Choose a place from search, or enter its location." };
  }
  if (!startDate || !endDate) return { error: "Choose the dates you will be there." };
  if (endDate < startDate) return { error: "The last day must be on or after the first day." };
  if (startDate < trip.startDate || endDate > trip.endDate) {
    return { error: "Destination dates must fall inside the trip." };
  }

  return { data: { name, address, placeId, lat, lng, startDate, endDate, notes } };
}

export async function createDestination(tripId: string, _: unknown, formData: FormData) {
  const { trip } = await requireTrip(tripId);
  const parsed = readDestination(trip, formData);
  if (parsed.error !== undefined) return { error: parsed.error };

  const last = await prisma.destination.findFirst({
    where: { tripId },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.destination.create({
    data: {
      tripId,
      ...parsed.data,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/map`);
  return { ok: true };
}

export async function updateDestination(tripId: string, destinationId: string, _: unknown, formData: FormData) {
  const { trip } = await requireTrip(tripId);
  const existing = await prisma.destination.findFirst({ where: { id: destinationId, tripId } });
  if (!existing) return { error: "Destination not found." };
  const parsed = readDestination(trip, formData);
  if (parsed.error !== undefined) return { error: parsed.error };

  await prisma.destination.update({
    where: { id: destinationId },
    data: parsed.data,
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/map`);
  return { ok: true };
}

export async function deleteDestination(tripId: string, destinationId: string) {
  await requireTrip(tripId);
  const destination = await prisma.destination.findFirst({
    where: { id: destinationId, tripId },
    include: { activities: true },
  });
  if (!destination) return { error: "Destination not found." };
  for (const activity of destination.activities) {
    await deleteExpenseById(activity.expenseId);
  }
  await prisma.destination.delete({ where: { id: destinationId } });
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function createActivity(tripId: string, destinationId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const destination = await prisma.destination.findFirst({ where: { id: destinationId, tripId } });
  if (!destination) return { error: "Destination not found." };

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const startRaw = String(formData.get("startAt") ?? "");
  const endRaw = String(formData.get("endAt") ?? "");
  const startAt = startRaw ? parseDateTime(startRaw) : null;
  const endAt = endRaw ? parseDateTime(endRaw) : null;
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((tag) => ACTIVITY_TAGS.includes(tag as (typeof ACTIVITY_TAGS)[number]));

  if (!title) return { error: "Name the activity." };
  if (startRaw && !startAt) return { error: "Start time is invalid." };
  if (endRaw && !endAt) return { error: "End time is invalid." };

  const amountRaw = String(formData.get("amount") ?? "").trim();
  let expenseId: string | undefined;
  if (amountRaw) {
    const amount = Number(amountRaw);
    const currency = String(formData.get("currency") ?? "").toUpperCase();
    const manualRaw = String(formData.get("manualRate") ?? "").trim();
    const members = await acceptedMembers(tripId);
    const created = await createSimplePlannedExpense({
      tripId,
      title,
      category: "ACTIVITY",
      amount,
      currency,
      date: destination.startDate,
      paidById: user.id,
      memberIds: members.map((member) => member.userId),
      manualRate: manualRaw ? Number(manualRaw) : null,
      notes,
    });
    if ("error" in created) return created;
    expenseId = created.expense.id;
  }

  await prisma.activity.create({
    data: {
      destinationId,
      title,
      notes,
      tags,
      startAt,
      endAt,
      expenseId,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function updateActivity(tripId: string, activityId: string, _: unknown, formData: FormData) {
  await requireTrip(tripId);
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, destination: { tripId } },
  });
  if (!activity) return { error: "Activity not found." };

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const startRaw = String(formData.get("startAt") ?? "").slice(0, 16);
  const endRaw = String(formData.get("endAt") ?? "").slice(0, 16);
  const startAt = startRaw ? parseDateTime(startRaw) : null;
  const endAt = endRaw ? parseDateTime(endRaw) : null;

  if (!title) return { error: "Name the activity." };
  if (startRaw && !startAt) return { error: "Start time is invalid." };
  if (endRaw && !endAt) return { error: "End time is invalid." };
  if (startAt && endAt && endAt < startAt) return { error: "End time must be after the start." };

  await prisma.activity.update({
    where: { id: activityId },
    data: { title, notes, startAt, endAt },
  });
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function deleteActivity(tripId: string, activityId: string) {
  await requireTrip(tripId);
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, destination: { tripId } },
  });
  if (!activity) return { error: "Activity not found." };
  await prisma.activity.delete({ where: { id: activityId } });
  await deleteExpenseById(activity.expenseId);
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
