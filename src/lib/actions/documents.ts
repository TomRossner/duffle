"use server";

import { revalidatePath } from "next/cache";
import { DOCUMENT_KINDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { notifyTrip } from "@/lib/notify";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { storeImage } from "@/lib/uploads";

export async function createDocument(tripId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const userId = String(formData.get("userId") ?? "");

  if (!title) return { error: "Name the document." };
  if (!DOCUMENT_KINDS.includes(kind as (typeof DOCUMENT_KINDS)[number])) {
    return { error: "Choose a document type." };
  }

  const members = await acceptedMembers(tripId);
  if (!members.some((member) => member.userId === userId)) {
    return { error: "Choose a traveler on this trip." };
  }

  const stored = await storeImage(formData.get("file"), `documents/${tripId}`);
  if ("empty" in stored) return { error: "Choose an image." };
  if ("error" in stored) return stored;

  await prisma.document.create({
    data: {
      tripId,
      userId,
      title,
      kind,
      storageKey: stored.key,
      mimeType: stored.mimeType,
    },
  });

  revalidatePath(`/trips/${tripId}/documents`);
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    message: "documentAdded",
    values: { name: user.name ?? "", item: title },
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}

export async function updateDocument(tripId: string, documentId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const document = await prisma.document.findFirst({ where: { id: documentId, tripId } });
  if (!document) return { error: "Document not found." };

  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const userId = String(formData.get("userId") ?? "");

  if (!title) return { error: "Name the document." };
  if (!DOCUMENT_KINDS.includes(kind as (typeof DOCUMENT_KINDS)[number])) {
    return { error: "Choose a document type." };
  }

  const members = await acceptedMembers(tripId);
  if (!members.some((member) => member.userId === userId)) {
    return { error: "Choose a traveler on this trip." };
  }

  const stored = await storeImage(formData.get("file"), `documents/${tripId}`);
  if ("error" in stored) return stored;

  await prisma.document.update({
    where: { id: documentId },
    data: {
      title,
      kind,
      userId,
      ...("key" in stored ? { storageKey: stored.key, mimeType: stored.mimeType } : {}),
    },
  });

  revalidatePath(`/trips/${tripId}/documents`);
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    message: "documentUpdated",
    values: { name: user.name ?? "", item: title },
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}

export async function deleteDocument(tripId: string, documentId: string) {
  const { user } = await requireTrip(tripId);
  const document = await prisma.document.findFirst({ where: { id: documentId, tripId } });
  if (!document) return { error: "Document not found." };
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/trips/${tripId}/documents`);
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    message: "documentRemoved",
    values: { name: user.name ?? "", item: document.title },
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}
