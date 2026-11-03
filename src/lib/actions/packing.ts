"use server";

import type { ClothingSlot, PackingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { eachDate, formatDate } from "@/lib/dates";
import { packingAgentConfigured, suggestPackingWithAgent } from "@/lib/packing-agent";
import { suggestPacking, type PackingDayContext } from "@/lib/packing";
import type { SuggestClothesStep } from "@/lib/suggest-clothes-steps";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";

export async function collectPackingSuggestions(
  tripId: string,
  onStep?: (step: SuggestClothesStep) => void | Promise<void>,
) {
  const { user, trip } = await requireTrip(tripId);
  await onStep?.("forecast");
  const [items, destinations] = await Promise.all([
    prisma.closetItem.findMany({ where: { userId: user.id } }),
    prisma.destination.findMany({
      where: { tripId },
      include: { weatherDays: true, activities: true },
      orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (items.length === 0) return { error: "Add clothes to your closet before suggesting a packing list." };
  if (destinations.length === 0) return { error: "Add a destination so suggestions can use the weather and plans." };

  const days: PackingDayContext[] = eachDate(trip.startDate, trip.endDate).map((date) => {
    const key = formatDate(date);
    const destination = [...destinations]
      .reverse()
      .find((item) => formatDate(item.startDate) <= key && formatDate(item.endDate) >= key);
    const weather = destination?.weatherDays.find((day) => formatDate(day.date) === key);
    const activityTags = new Set<string>();
    const plans: string[] = [];
    for (const activity of destination?.activities ?? []) {
      const activityDay = activity.startAt ? formatDate(activity.startAt) : null;
      if (!activityDay || activityDay === key) {
        for (const tag of activity.tags) activityTags.add(tag);
        if (activity.title) plans.push(activity.title);
      }
    }
    return {
      date: key,
      tempMin: weather?.tempMin ?? null,
      tempMax: weather?.tempMax ?? null,
      precipitation: weather?.precipitation ?? 0,
      windSpeed: weather?.windSpeed ?? 0,
      condition: weather?.condition ?? null,
      activityTags: [...activityTags],
      place: destination?.name ?? null,
      plans,
    };
  });

  const closet = items.map((item) => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    tempMin: item.tempMin,
    tempMax: item.tempMax,
    conditions: item.conditions,
    activities: item.activities,
    description: item.description,
    quantity: item.quantity,
    goreTex: item.goreTex,
    driFit: item.driFit,
  }));
  await onStep?.("match");
  const rules = suggestPacking(closet, days);
  let suggestions = rules;
  if (packingAgentConfigured()) {
    await onStep?.("choose");
    suggestions = (await suggestPackingWithAgent(closet, days, rules)) ?? rules;
  }

  return { user, suggestions, items };
}

export async function generatePacking(tripId: string) {
  const collected = await collectPackingSuggestions(tripId);
  if (collected.error !== undefined) return { error: collected.error };
  const { user, suggestions } = collected;

  const locked = await prisma.packingChoice.findMany({
    where: { tripId, userId: user.id, status: { in: ["PACKED", "SKIPPED"] } },
  });
  const lockedKeys = new Set(locked.map((choice) => `${choice.closetItemId}:${formatDate(choice.date)}`));

  await prisma.packingChoice.deleteMany({
    where: { tripId, userId: user.id, status: "SUGGESTED" },
  });

  const fresh = suggestions.filter((suggestion) => !lockedKeys.has(`${suggestion.closetItemId}:${suggestion.date}`));
  if (fresh.length > 0) {
    await prisma.packingChoice.createMany({
      data: fresh.map((suggestion) => ({
        tripId,
        userId: user.id,
        closetItemId: suggestion.closetItemId,
        date: new Date(`${suggestion.date}T00:00:00.000Z`),
        status: "SUGGESTED" as const,
        reason: suggestion.reason,
        slot: suggestion.slot as ClothingSlot,
      })),
    });
  }

  revalidatePath(`/trips/${tripId}/packing`);
  if (suggestions.length === 0) {
    return { error: "Nothing matched. Add closet items with a slot, temperature range, and tags." };
  }
  return { ok: true, count: fresh.length };
}

export async function setPackingStatus(tripId: string, closetItemId: string, status: PackingStatus) {
  const { user } = await requireTrip(tripId);
  if (status !== "PACKED" && status !== "SKIPPED" && status !== "SUGGESTED") {
    return { error: "Unknown status." };
  }
  const updated = await prisma.packingChoice.updateMany({
    where: { tripId, userId: user.id, closetItemId },
    data: { status },
  });
  if (updated.count === 0) return { error: "That item is not on this packing list." };
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}
