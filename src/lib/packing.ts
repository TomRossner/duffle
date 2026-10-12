import type { ClothingSlot } from "@prisma/client";
import { slotFamily, type SlotFamily } from "@/lib/constants";
import { dateKey } from "@/lib/dates";

export type PackingClosetItem = {
  id: string;
  name: string;
  slot: ClothingSlot;
  tempMin: number | null;
  tempMax: number | null;
  conditions: string[];
  activities: string[];
};

export type PackingDayContext = {
  date: string;
  tempMin: number | null;
  tempMax: number | null;
  precipitation: number;
  windSpeed: number;
  condition: string | null;
  activityTags: string[];
};

export type PackingSuggestion = {
  closetItemId: string;
  date: string;
  slot: ClothingSlot;
  reason: string;
};

function dayConditions(day: PackingDayContext) {
  const tags = new Set<string>();
  const rainy =
    day.precipitation >= 1 ||
    day.condition === "Rain" ||
    day.condition === "Thunderstorm";
  if (rainy) tags.add("RAIN");
  if (day.condition === "Snow") tags.add("SNOW");
  if ((day.tempMax ?? 0) >= 26 || day.condition === "Clear") tags.add("SUN");
  if ((day.tempMax ?? 99) < 12) tags.add("COLD");
  if (day.windSpeed >= 40) tags.add("WIND");
  return tags;
}

function scoreItem(item: PackingClosetItem, day: PackingDayContext, conditions: Set<string>) {
  let score = 0;
  if (item.tempMin != null && item.tempMax != null && day.tempMin != null && day.tempMax != null) {
    const mid = (day.tempMin + day.tempMax) / 2;
    if (mid >= item.tempMin && mid <= item.tempMax) score += 5;
    else {
      const distance = mid < item.tempMin ? item.tempMin - mid : mid - item.tempMax;
      score += Math.max(0, 3 - distance / 5);
    }
  } else {
    score += 1;
  }

  for (const condition of conditions) {
    if (item.conditions.includes(condition)) score += 3;
  }
  for (const activity of day.activityTags) {
    if (item.activities.includes(activity)) score += 4;
  }
  return score;
}

function neededSlots(day: PackingDayContext, conditions: Set<string>): SlotFamily[] {
  const slots: SlotFamily[] = ["TOP", "BOTTOM", "SHOES", "SOCKS"];
  if (conditions.has("COLD") || conditions.has("RAIN") || conditions.has("SNOW") || (day.tempMax ?? 99) < 16) {
    slots.push("OUTER");
  }
  if (day.activityTags.includes("BEACH")) slots.push("SWIM");
  if (day.activityTags.includes("DINNER")) slots.push("FORMAL");
  if (conditions.has("RAIN") || conditions.has("SUN") || conditions.has("SNOW")) slots.push("ACCESSORY");
  return slots;
}

function reasonFor(day: PackingDayContext, slot: SlotFamily) {
  const weather =
    day.tempMin != null && day.tempMax != null
      ? `${Math.round(day.tempMin)}–${Math.round(day.tempMax)}°C`
      : "no forecast";
  const activity = day.activityTags.length > 0 ? day.activityTags.join(", ").toLowerCase() : day.condition ?? "day";
  return `${weather}, ${activity}: ${slot.toLowerCase()}`;
}

export function suggestPacking(items: PackingClosetItem[], days: PackingDayContext[]): PackingSuggestion[] {
  const suggestions: PackingSuggestion[] = [];

  for (const day of days) {
    const conditions = dayConditions(day);
    for (const slot of neededSlots(day, conditions)) {
      const candidates = items.filter((item) => slotFamily(item.slot) === slot);
      if (candidates.length === 0) continue;
      const ranked = candidates
        .map((item) => ({ item, score: scoreItem(item, day, conditions) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best || best.score <= 0) continue;
      suggestions.push({
        closetItemId: best.item.id,
        date: dateKey(new Date(`${day.date}T00:00:00.000Z`)),
        slot,
        reason: reasonFor(day, slot),
      });
    }
  }

  return suggestions;
}
