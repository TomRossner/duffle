"use server";

import type { PackingCategory as PrismaCategory, LuggageKind as PrismaKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import { collectPackingSuggestions } from "@/lib/actions/packing";
import type { SuggestClothesStep } from "@/lib/suggest-clothes-steps";
import { prisma } from "@/lib/prisma";
import {
  categoryForSlot,
  isLuggageKind,
  isPackingCategory,
  readQuantity,
} from "@/lib/packing-list";
import { requireTrip } from "@/lib/trip-access";

type ActionState = { error?: string; ok?: boolean; count?: number } | null;

function cleanName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().slice(0, 80);
}

async function ownedLuggage(tripId: string, userId: string, luggageId: string) {
  return prisma.luggage.findFirst({ where: { id: luggageId, tripId, userId } });
}

async function takenClosetIds(tripId: string, userId: string) {
  const rows = await prisma.packingItem.findMany({
    where: { closetItemId: { not: null }, luggage: { tripId, userId } },
    select: { closetItemId: true },
  });
  return new Set(rows.map((row) => row.closetItemId).filter((id): id is string => Boolean(id)));
}

export async function createLuggage(tripId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const name = cleanName(formData.get("name"));
  const kind = String(formData.get("kind") ?? "");
  if (!name) return { error: t("errors.nameBag") };
  if (!isLuggageKind(kind)) return { error: t("errors.chooseKind") };
  const count = await prisma.luggage.count({ where: { tripId, userId: user.id } });
  await prisma.luggage.create({
    data: { tripId, userId: user.id, name, kind: kind as PrismaKind, sortOrder: count },
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function updateLuggage(tripId: string, luggageId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  const name = cleanName(formData.get("name"));
  const kind = String(formData.get("kind") ?? "");
  if (!name) return { error: t("errors.nameBag") };
  if (!isLuggageKind(kind)) return { error: t("errors.chooseKind") };
  await prisma.luggage.update({ where: { id: luggage.id }, data: { name, kind: kind as PrismaKind } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function clearLuggageItems(tripId: string, luggageId: string) {
  const t = await getT("packing");
  if (process.env.NODE_ENV === "production") return { error: t("errors.notAvailable") };
  const { user } = await requireTrip(tripId);
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  await prisma.packingItem.deleteMany({ where: { luggageId: luggage.id } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function deleteLuggage(tripId: string, luggageId: string) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  await prisma.luggage.delete({ where: { id: luggage.id } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function createPackingItem(tripId: string, luggageId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  const quantity = readQuantity(formData.get("quantity"));
  if (quantity == null) return { error: t("errors.quantity") };
  const categoryValue = String(formData.get("category") ?? "");
  if (!isPackingCategory(categoryValue)) return { error: t("errors.chooseCategory") };

  const closetItemId = String(formData.get("closetItemId") ?? "");
  let name = cleanName(formData.get("name"));
  let category = categoryValue;
  if (closetItemId) {
    const closetItem = await prisma.closetItem.findFirst({ where: { id: closetItemId, userId: user.id } });
    if (!closetItem) return { error: t("errors.closetNotYours") };
    const taken = await takenClosetIds(tripId, user.id);
    if (taken.has(closetItem.id)) return { error: t("errors.closetTaken") };
    if (!name) name = closetItem.name;
    if (!formData.get("category")) category = categoryForSlot(closetItem.slot);
  }
  if (!name) return { error: t("errors.nameItem") };

  const count = await prisma.packingItem.count({ where: { luggageId: luggage.id } });
  await prisma.packingItem.create({
    data: {
      luggageId: luggage.id,
      name,
      category: category as PrismaCategory,
      quantity,
      closetItemId: closetItemId || null,
      sortOrder: count,
    },
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function updatePackingItem(tripId: string, itemId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const item = await prisma.packingItem.findFirst({
    where: { id: itemId, luggage: { tripId, userId: user.id } },
  });
  if (!item) return { error: t("errors.itemNotYours") };
  const name = cleanName(formData.get("name"));
  const category = String(formData.get("category") ?? "");
  const luggageId = String(formData.get("luggageId") ?? "");
  const quantity = readQuantity(formData.get("quantity"));
  if (!name) return { error: t("errors.nameItem") };
  if (!isPackingCategory(category)) return { error: t("errors.chooseCategory") };
  if (quantity == null) return { error: t("errors.quantity") };
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.chooseBag") };
  await prisma.packingItem.update({
    where: { id: item.id },
    data: { name, category: category as PrismaCategory, quantity, luggageId: luggage.id },
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function deletePackingItem(tripId: string, itemId: string) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const item = await prisma.packingItem.findFirst({
    where: { id: itemId, luggage: { tripId, userId: user.id } },
  });
  if (!item) return { error: t("errors.itemNotYours") };
  await prisma.packingItem.delete({ where: { id: item.id } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function movePackingItem(tripId: string, itemId: string, luggageId: string) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const item = await prisma.packingItem.findFirst({
    where: { id: itemId, luggage: { tripId, userId: user.id } },
  });
  if (!item) return { error: t("errors.itemNotYours") };
  if (item.luggageId === luggageId) return { ok: true };
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  const count = await prisma.packingItem.count({ where: { luggageId: luggage.id } });
  await prisma.packingItem.update({
    where: { id: item.id },
    data: { luggageId: luggage.id, sortOrder: count },
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function setPackingItemPacked(tripId: string, itemId: string, packed: boolean) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const item = await prisma.packingItem.findFirst({
    where: { id: itemId, luggage: { tripId, userId: user.id } },
  });
  if (!item) return { error: t("errors.itemNotYours") };
  await prisma.packingItem.update({ where: { id: item.id }, data: { packed } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function addClosetItems(tripId: string, luggageId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const luggage = await ownedLuggage(tripId, user.id, luggageId);
  if (!luggage) return { error: t("errors.bagNotYours") };
  const ids = formData.getAll("closetItemId").map(String).filter(Boolean);
  if (ids.length === 0) return { error: t("errors.chooseCloset") };
  const closetItems = await prisma.closetItem.findMany({ where: { userId: user.id, id: { in: ids } } });
  const taken = await takenClosetIds(tripId, user.id);
  const fresh = closetItems.filter((item) => !taken.has(item.id));
  if (fresh.length === 0) return { error: t("errors.closetAllTaken") };
  const count = await prisma.packingItem.count({ where: { luggageId: luggage.id } });
  await prisma.packingItem.createMany({
    data: fresh.map((item, index) => ({
      luggageId: luggage.id,
      name: item.name,
      category: categoryForSlot(item.slot) as PrismaCategory,
      closetItemId: item.id,
      sortOrder: count + index,
    })),
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function addSuggestedClothes(
  tripId: string,
  _state: ActionState,
  formData: FormData,
  onStep?: (step: SuggestClothesStep) => void | Promise<void>,
) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const collected = await collectPackingSuggestions(tripId, onStep);
  if ("error" in collected) return collected;
  const uniqueIds = [...new Set(collected.suggestions.map((suggestion) => suggestion.closetItemId))];
  const byId = new Map(collected.items.map((item) => [item.id, item]));
  const taken = await takenClosetIds(tripId, user.id);
  const fresh = uniqueIds.flatMap((id) => {
    const item = byId.get(id);
    if (!item || taken.has(item.id)) return [];
    const related = collected.suggestions.filter((suggestion) => suggestion.closetItemId === id);
    const quantity = related.reduce((max, suggestion) => Math.max(max, suggestion.quantity), 1);
    const note = related.find((suggestion) => suggestion.note)?.note ?? null;
    return [{ item, quantity, note }];
  });
  if (fresh.length === 0) {
    return { error: t("errors.nothingNew") };
  }

  await onStep?.("save");
  const requestedId = String(formData.get("luggageId") ?? "");
  let luggage = requestedId ? await ownedLuggage(tripId, user.id, requestedId) : null;
  if (!luggage) {
    luggage = await prisma.luggage.findFirst({
      where: { tripId, userId: user.id },
      orderBy: { sortOrder: "asc" },
    });
  }
  if (!luggage) return { error: t("errors.addBagFirst") };

  const count = await prisma.packingItem.count({ where: { luggageId: luggage.id } });
  await prisma.packingItem.createMany({
    data: fresh.map((entry, index) => ({
      luggageId: luggage.id,
      name: entry.item.name,
      category: categoryForSlot(entry.item.slot) as PrismaCategory,
      closetItemId: entry.item.id,
      quantity: entry.quantity,
      note: entry.note,
      sortOrder: count + index,
    })),
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true, count: fresh.length };
}

async function bagForSharedCheck(tripId: string, userId: string, luggageId: string) {
  const chosen = luggageId ? await ownedLuggage(tripId, userId, luggageId) : null;
  if (chosen) return chosen;
  const existing = await prisma.luggage.findFirst({
    where: { tripId, userId },
    orderBy: { sortOrder: "asc" },
  });
  if (existing) return existing;
  return prisma.luggage.create({
    data: { tripId, userId, name: (await getT("packing"))("bag.defaultName"), kind: "PACK" },
  });
}

export async function createSharedPackingItem(tripId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  await requireTrip(tripId);
  const name = cleanName(formData.get("name"));
  const category = String(formData.get("category") ?? "");
  const quantity = readQuantity(formData.get("quantity"));
  if (!name) return { error: t("errors.nameItem") };
  if (!isPackingCategory(category)) return { error: t("errors.chooseCategory") };
  if (quantity == null) return { error: t("errors.quantity") };
  const count = await prisma.sharedPackingItem.count({ where: { tripId } });
  await prisma.sharedPackingItem.create({
    data: { tripId, name, category: category as PrismaCategory, quantity, sortOrder: count },
  });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function updateSharedPackingItem(tripId: string, itemId: string, _state: ActionState, formData: FormData) {
  const t = await getT("packing");
  await requireTrip(tripId);
  const item = await prisma.sharedPackingItem.findFirst({ where: { id: itemId, tripId } });
  if (!item) return { error: t("errors.notShared") };
  const name = cleanName(formData.get("name"));
  const category = String(formData.get("category") ?? "");
  const quantity = readQuantity(formData.get("quantity"));
  if (!name) return { error: t("errors.nameItem") };
  if (!isPackingCategory(category)) return { error: t("errors.chooseCategory") };
  if (quantity == null) return { error: t("errors.quantity") };
  const checks = await prisma.sharedPackingCheck.findMany({
    where: { sharedItemId: item.id, packingItemId: { not: null } },
    select: { packingItemId: true },
  });
  await prisma.$transaction([
    prisma.sharedPackingItem.update({
      where: { id: item.id },
      data: { name, category: category as PrismaCategory, quantity },
    }),
    ...checks.flatMap((check) =>
      check.packingItemId
        ? [
            prisma.packingItem.update({
              where: { id: check.packingItemId },
              data: { name, category: category as PrismaCategory, quantity },
            }),
          ]
        : [],
    ),
  ]);
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function deleteSharedPackingItem(tripId: string, itemId: string) {
  const t = await getT("packing");
  await requireTrip(tripId);
  const item = await prisma.sharedPackingItem.findFirst({ where: { id: itemId, tripId } });
  if (!item) return { error: t("errors.notShared") };
  await prisma.sharedPackingItem.delete({ where: { id: item.id } });
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}

export async function setSharedPackingChecked(tripId: string, itemId: string, checked: boolean, luggageId: string) {
  const t = await getT("packing");
  const { user } = await requireTrip(tripId);
  const shared = await prisma.sharedPackingItem.findFirst({ where: { id: itemId, tripId } });
  if (!shared) return { error: t("errors.notShared") };
  const existing = await prisma.sharedPackingCheck.findUnique({
    where: { sharedItemId_userId: { sharedItemId: shared.id, userId: user.id } },
    include: { packingItem: true },
  });

  if (!checked) {
    if (existing?.packingItem) {
      await prisma.packingItem.update({ where: { id: existing.packingItem.id }, data: { packed: false } });
    }
    revalidatePath(`/trips/${tripId}/packing`);
    return { ok: true };
  }

  if (existing?.packingItem) {
    await prisma.packingItem.update({ where: { id: existing.packingItem.id }, data: { packed: true } });
    revalidatePath(`/trips/${tripId}/packing`);
    return { ok: true };
  }

  const luggage = await bagForSharedCheck(tripId, user.id, luggageId);
  const count = await prisma.packingItem.count({ where: { luggageId: luggage.id } });
  const packingItem = await prisma.packingItem.create({
    data: {
      luggageId: luggage.id,
      name: shared.name,
      category: shared.category,
      quantity: shared.quantity,
      packed: true,
      sortOrder: count,
    },
  });
  if (existing) {
    await prisma.sharedPackingCheck.update({
      where: { id: existing.id },
      data: { packingItemId: packingItem.id },
    });
  } else {
    await prisma.sharedPackingCheck.create({
      data: { sharedItemId: shared.id, userId: user.id, packingItemId: packingItem.id },
    });
  }
  revalidatePath(`/trips/${tripId}/packing`);
  return { ok: true };
}
