"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { ACTIVITY_TAGS } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import { createSimplePlannedExpense, deleteExpenseById } from "@/lib/expenses";
import { searchPlaces } from "@/lib/places";
import { prisma } from "@/lib/prisma";
import { planSeries, readScheduleWhen, repeatTimes } from "@/lib/schedule-when";
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
  const { user, trip } = await requireTrip(tripId);
  const destination = await prisma.destination.findFirst({ where: { id: destinationId, tripId } });
  if (!destination) return { error: "Destination not found." };

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((tag) => ACTIVITY_TAGS.includes(tag as (typeof ACTIVITY_TAGS)[number]));

  if (!title) return { error: "Name the activity." };
  // An activity may be left unscheduled; then there's nothing to repeat.
  const when = readScheduleWhen(formData, trip, { requireStart: false });
  if ("error" in when) return when;
  const times =
    "empty" in when
      ? [{ startAt: null, endAt: null }]
      : [{ startAt: when.startAt, endAt: when.endAt }, ...repeatTimes(when)];
  const allDay = "empty" in when ? false : when.allDay;
  const seriesId = times.length > 1 ? randomUUID() : null;

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

  // The cost (if any) belongs to the first day only, so it isn't counted once per copy.
  await prisma.activity.createMany({
    data: times.map((timing, index) => ({
      destinationId,
      title,
      notes,
      tags,
      ...timing,
      allDay,
      seriesId,
      expenseId: index === 0 ? expenseId : undefined,
    })),
  });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function updateActivity(tripId: string, activityId: string, _: unknown, formData: FormData) {
  const { trip } = await requireTrip(tripId);
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, destination: { tripId } },
  });
  if (!activity) return { error: "Activity not found." };

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!title) return { error: "Name the activity." };
  // Only forms that show the tag picker send this marker; others leave tags as they are.
  const tags = formData.has("editTags")
    ? formData
        .getAll("tags")
        .map(String)
        .filter((tag) => ACTIVITY_TAGS.includes(tag as (typeof ACTIVITY_TAGS)[number]))
    : undefined;

  const when = readScheduleWhen(formData, trip, { requireStart: false });
  if ("error" in when) return when;
  if ("empty" in when) {
    // Unscheduling only affects this activity; its series copies keep their days.
    await prisma.activity.update({
      where: { id: activityId },
      data: { title, notes, ...(tags ? { tags } : {}), startAt: null, endAt: null, allDay: false },
    });
    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  }

  // The form's days describe the whole series, so edits apply to every day of it.
  const members = activity.seriesId
    ? await prisma.activity.findMany({
        where: { seriesId: activity.seriesId, destination: { tripId } },
        select: { id: true, startAt: true, expenseId: true },
      })
    : [activity];
  const plan = planSeries(when, activity.id, members);
  const seriesId = activity.seriesId ?? (plan.create.length > 0 ? randomUUID() : null);
  const shared = { title, notes, allDay: when.allDay, seriesId, ...(tags ? { tags } : {}) };

  // Keep the cost when the day holding it is dropped: move it to the activity being edited.
  const removed = members.filter((member) => plan.remove.includes(member.id));
  const orphanExpense = activity.expenseId ? null : (removed.find((member) => member.expenseId)?.expenseId ?? null);

  await prisma.$transaction([
    prisma.activity.deleteMany({ where: { id: { in: plan.remove }, destination: { tripId } } }),
    ...plan.update.map(({ id, startAt, endAt }) =>
      prisma.activity.update({
        where: { id },
        data: { ...shared, startAt, endAt, ...(id === activity.id && orphanExpense ? { expenseId: orphanExpense } : {}) },
      }),
    ),
    // New days share the place and tags; the cost stays on one activity only.
    prisma.activity.createMany({
      data: plan.create.map((timing) => ({
        destinationId: activity.destinationId,
        tags: activity.tags,
        lat: activity.lat,
        // `shared` overrides the tags above when this form edits them.
        lng: activity.lng,
        placeId: activity.placeId,
        ...shared,
        ...timing,
      })),
    }),
  ]);
  for (const member of removed) {
    if (member.expenseId && member.expenseId !== orphanExpense) await deleteExpenseById(member.expenseId);
  }
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
