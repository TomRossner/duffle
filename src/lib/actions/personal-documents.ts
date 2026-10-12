"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { notifyTrip } from "@/lib/notify";
import { isPersonalDocumentKind } from "@/lib/personal-documents";
import { prisma } from "@/lib/prisma";
import { requireTrip, requireUser } from "@/lib/trip-access";
import { storeImage } from "@/lib/uploads";

function readOptionalDate(value: FormDataEntryValue | null, label: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: null } as const;
  const date = parseDate(raw);
  if (!date) return { error: `${label} must be a real date.` } as const;
  return { date } as const;
}

function readDetails(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const documentNumber = String(formData.get("documentNumber") ?? "").trim();
  if (!title) return { error: "Name the document." } as const;
  if (title.length > 80) return { error: "Name must be 80 characters or fewer." } as const;
  if (!isPersonalDocumentKind(kind)) return { error: "Choose a document type." } as const;
  if (documentNumber.length > 40) return { error: "Document number must be 40 characters or fewer." } as const;
  const issued = readOptionalDate(formData.get("issuedOn"), "Issue date");
  if ("error" in issued) return issued;
  const expires = readOptionalDate(formData.get("expiresOn"), "Expiry date");
  if ("error" in expires) return expires;
  if (issued.date && expires.date && expires.date < issued.date) {
    return { error: "Expiry date must be on or after the issue date." } as const;
  }
  return {
    title,
    kind,
    documentNumber: documentNumber || null,
    issuedOn: issued.date,
    expiresOn: expires.date,
  } as const;
}

export async function createPersonalDocument(_: unknown, formData: FormData) {
  const user = await requireUser();
  const details = readDetails(formData);
  if ("error" in details) return details;

  const stored = await storeImage(formData.get("file"), `identity/${user.id}`);
  if ("empty" in stored) return { error: "Choose an image." };
  if ("error" in stored) return stored;

  await prisma.personalDocument.create({
    data: {
      userId: user.id,
      title: details.title,
      kind: details.kind,
      documentNumber: details.documentNumber,
      issuedOn: details.issuedOn,
      expiresOn: details.expiresOn,
      storageKey: stored.key,
      mimeType: stored.mimeType,
    },
  });

  revalidatePath("/documents");
  return { ok: true };
}

export async function updatePersonalDocument(documentId: string, _: unknown, formData: FormData) {
  const user = await requireUser();
  const document = await prisma.personalDocument.findFirst({
    where: { id: documentId, userId: user.id },
    include: { attachments: { select: { tripId: true } } },
  });
  if (!document) return { error: "Document not found." };

  const details = readDetails(formData);
  if ("error" in details) return details;

  const stored = await storeImage(formData.get("file"), `identity/${user.id}`);
  if ("error" in stored) return stored;

  await prisma.personalDocument.update({
    where: { id: document.id },
    data: {
      title: details.title,
      kind: details.kind,
      documentNumber: details.documentNumber,
      issuedOn: details.issuedOn,
      expiresOn: details.expiresOn,
      ...("key" in stored ? { storageKey: stored.key, mimeType: stored.mimeType } : {}),
    },
  });

  revalidatePath("/documents");
  for (const attachment of document.attachments) {
    revalidatePath(`/trips/${attachment.tripId}/documents`);
  }
  return { ok: true };
}

export async function deletePersonalDocument(documentId: string) {
  const user = await requireUser();
  const document = await prisma.personalDocument.findFirst({
    where: { id: documentId, userId: user.id },
    include: { attachments: { select: { tripId: true } } },
  });
  if (!document) return { error: "Document not found." };

  await prisma.personalDocument.delete({ where: { id: document.id } });
  revalidatePath("/documents");
  for (const attachment of document.attachments) {
    revalidatePath(`/trips/${attachment.tripId}/documents`);
  }
  return { ok: true };
}

export async function attachPersonalDocument(tripId: string, documentId: string) {
  const { user } = await requireTrip(tripId);
  const document = await prisma.personalDocument.findFirst({ where: { id: documentId, userId: user.id } });
  if (!document) return { error: "Document not found." };

  await prisma.tripDocumentAttachment.upsert({
    where: { tripId_personalDocumentId: { tripId, personalDocumentId: document.id } },
    create: { tripId, personalDocumentId: document.id },
    update: {},
  });

  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath("/documents");
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    title: "Document added",
    body: `${user.name ?? "A traveler"} added ${document.title}.`,
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}

export async function detachPersonalDocument(tripId: string, documentId: string) {
  const { user } = await requireTrip(tripId);
  const document = await prisma.personalDocument.findFirst({ where: { id: documentId, userId: user.id } });
  if (!document) return { error: "Document not found." };

  await prisma.tripDocumentAttachment.deleteMany({
    where: { tripId, personalDocumentId: document.id },
  });

  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath("/documents");
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    title: "Document removed",
    body: `${user.name ?? "A traveler"} removed ${document.title}.`,
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}
