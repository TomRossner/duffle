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
  description?: string | null;
  quantity?: number;
  goreTex?: boolean;
  driFit?: boolean;
};

export type PackingDayContext = {
  date: string;
  tempMin: number | null;
  tempMax: number | null;
  precipitation: number;
  windSpeed: number;
  condition: string | null;
  activityTags: string[];
  place?: string | null;
  plans?: string[];
};

export type PackingSuggestion = {
  closetItemId: string;
  date: string;
  slot: ClothingSlot;
  reason: string;
  quantity: number;
  note: string | null;
};

export type PackingPick = {
  closetItemId: string;
  quantity: number;
  dates: string[];
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
        quantity: 1,
        note: null,
      });
    }
  }

  return suggestions;
}

const PROMPT_CLOSET_LIMIT = 48;

export function closetForPrompt(items: PackingClosetItem[], days: PackingDayContext[]) {
  if (items.length <= PROMPT_CLOSET_LIMIT) return items;
  const best = new Map<string, number>();
  for (const day of days) {
    const conditions = dayConditions(day);
    for (const family of neededSlots(day, conditions)) {
      const ranked = items
        .filter((item) => slotFamily(item.slot) === family)
        .map((item) => ({ item, score: scoreItem(item, day, conditions) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      for (const row of ranked) {
        best.set(row.item.id, Math.max(best.get(row.item.id) ?? 0, row.score));
      }
    }
  }
  const chosen = items.filter((item) => best.has(item.id));
  return chosen.length > 0 ? chosen : items.slice(0, PROMPT_CLOSET_LIMIT);
}

function cleanReason(reason: string) {
  const text = reason.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function cleanQuantity(requested: number, available: number) {
  const cap = Math.min(Math.max(available, 1), 99);
  if (!Number.isFinite(requested)) return 1;
  return Math.min(cap, Math.max(1, Math.round(requested)));
}

export function applyPackingPicks(
  picks: PackingPick[],
  items: PackingClosetItem[],
  days: PackingDayContext[],
): PackingSuggestion[] {
  if (days.length === 0) return [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const allowed = new Set(days.map((day) => day.date));
  const order = new Map(days.map((day, index) => [day.date, index]));
  const merged = new Map<string, { quantity: number; dates: Set<string>; reason: string | null }>();

  for (const pick of picks) {
    const item = byId.get(pick.closetItemId);
    if (!item || (merged.size >= 24 && !merged.has(item.id))) continue;
    const dates = [...new Set(pick.dates.filter((date) => allowed.has(date)))];
    const worn = dates.length > 0 ? dates : [...allowed];
    const current = merged.get(item.id);
    if (!current) {
      merged.set(item.id, {
        quantity: cleanQuantity(pick.quantity, item.quantity ?? 1),
        dates: new Set(worn),
        reason: cleanReason(pick.reason),
      });
      continue;
    }
    current.quantity = Math.max(current.quantity, cleanQuantity(pick.quantity, item.quantity ?? 1));
    for (const date of worn) current.dates.add(date);
    if (!current.reason) current.reason = cleanReason(pick.reason);
  }

  const suggestions: PackingSuggestion[] = [];
  for (const [closetItemId, pick] of merged) {
    const item = byId.get(closetItemId);
    if (!item) continue;
    const dates = [...pick.dates].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    const reason = pick.reason ?? "Suggested for this trip.";
    for (const date of dates) {
      suggestions.push({
        closetItemId,
        date,
        slot: item.slot,
        reason,
        quantity: pick.quantity,
        note: pick.reason,
      });
    }
  }
  return suggestions;
}
