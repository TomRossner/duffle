"use server";

import { revalidatePath } from "next/cache";
import type { ClothingSlot } from "@prisma/client";
import { CLOSET_ACTIVITY_TAGS, CLOTHING_SLOTS, CONDITION_TAGS } from "@/lib/constants";
import { readQuantity } from "@/lib/packing-list";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";
import { closetReaderConfigured, readClosetItem, type ClosetFacts } from "@/lib/closet-reader";
import { checkUpload, storeImage } from "@/lib/uploads";

function readClosetInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const slot = String(formData.get("slot") ?? "");
  const quantity = readQuantity(formData.get("quantity"));
  const tempMinRaw = String(formData.get("tempMin") ?? "").trim();
  const tempMaxRaw = String(formData.get("tempMax") ?? "").trim();
  const conditions = formData
    .getAll("conditions")
    .map(String)
    .filter((tag) => CONDITION_TAGS.includes(tag as (typeof CONDITION_TAGS)[number]));
  const goreTex = formData.get("goreTex") === "yes";
  const driFit = formData.get("driFit") === "yes";
  const activities = formData
    .getAll("activities")
    .map(String)
    .filter((tag) => (CLOSET_ACTIVITY_TAGS as readonly string[]).includes(tag));

  if (!name) return { error: "Name the item." };
  if (!CLOTHING_SLOTS.includes(slot as (typeof CLOTHING_SLOTS)[number])) {
    return { error: "Choose what kind of clothing this is." };
  }
  if (quantity == null) return { error: "Quantity must be a whole number from 1 to 99." };
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "Image URL must start with http:// or https://." };
  }

  const tempMin = tempMinRaw ? Number(tempMinRaw) : null;
  const tempMax = tempMaxRaw ? Number(tempMaxRaw) : null;
  if ((tempMinRaw && !Number.isFinite(tempMin)) || (tempMaxRaw && !Number.isFinite(tempMax))) {
    return { error: "Temperature range must be numbers." };
  }
  if (tempMin != null && tempMax != null && tempMax < tempMin) {
    return { error: "The warm end of the range must be at least the cool end." };
  }

  return {
    name,
    description,
    imageUrl,
    slot: slot as ClothingSlot,
    quantity,
    tempMin,
    tempMax,
    conditions,
    activities,
    goreTex,
    driFit,
  };
}

/** Describe an uploaded clothing photo so the add form can be filled in before saving. */
export async function scanClosetItem(
  formData: FormData,
): Promise<{ status: "read"; facts: ClosetFacts } | { status: "unavailable" } | { status: "error"; error: string }> {
  await requireUser();
  const checked = checkUpload(formData.get("file"));
  if (checked.status === "empty") return { status: "error", error: "Choose an image." };
  if (checked.status === "invalid") return { status: "error", error: checked.error };
  if (!closetReaderConfigured()) return { status: "unavailable" };

  const facts = await readClosetItem(new Uint8Array(await checked.file.arrayBuffer()), checked.file.type);
  if (facts === "not-clothing") {
    return { status: "error", error: "This doesn't look like clothing. Fill in the details yourself." };
  }
  if (!facts) return { status: "error", error: "Couldn't read the photo. Fill in the details yourself." };
  return { status: "read", facts };
}

export async function createClosetItem(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = readClosetInput(formData);
  if ("error" in parsed) return parsed;

  const stored = await storeImage(formData.get("file"), `closet/${user.id}`);
  if ("error" in stored) return stored;

  await prisma.closetItem.create({
    data: {
      userId: user.id,
      name: parsed.name,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      imageKey: "key" in stored ? stored.key : null,
      slot: parsed.slot,
      quantity: parsed.quantity,
      tempMin: parsed.tempMin,
      tempMax: parsed.tempMax,
      conditions: parsed.conditions,
      activities: parsed.activities,
      goreTex: parsed.goreTex,
      driFit: parsed.driFit,
    },
  });

  revalidatePath("/closet");
  return { ok: true };
}

export async function updateClosetItem(itemId: string, _: unknown, formData: FormData) {
  const user = await requireUser();
  const item = await prisma.closetItem.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) return { error: "Item not found." };
  const parsed = readClosetInput(formData);
  if ("error" in parsed) return parsed;

  const stored = await storeImage(formData.get("file"), `closet/${user.id}`);
  if ("error" in stored) return stored;

  const imageKey = "key" in stored ? stored.key : parsed.imageUrl ? null : item.imageKey;
  const imageUrl = parsed.imageUrl ?? ("key" in stored ? null : item.imageUrl);

  await prisma.closetItem.update({
    where: { id: itemId },
    data: {
      name: parsed.name,
      description: parsed.description,
      imageUrl,
      imageKey,
      slot: parsed.slot,
      quantity: parsed.quantity,
      tempMin: parsed.tempMin,
      tempMax: parsed.tempMax,
      conditions: parsed.conditions,
      activities: parsed.activities,
      goreTex: parsed.goreTex,
      driFit: parsed.driFit,
    },
  });

  revalidatePath("/closet");
  return { ok: true };
}

export async function deleteClosetItem(itemId: string) {
  const user = await requireUser();
  const item = await prisma.closetItem.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) return { error: "Item not found." };
  await prisma.closetItem.delete({ where: { id: itemId } });
  revalidatePath("/closet");
  return { ok: true };
}
