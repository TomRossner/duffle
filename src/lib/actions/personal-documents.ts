"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { notifyTrip } from "@/lib/notify";
import { isPersonalDocumentKind } from "@/lib/personal-documents";
import { prisma } from "@/lib/prisma";
import { requireTrip, requireUser } from "@/lib/trip-access";
import { documentReaderConfigured, readDocumentFacts, type DocumentFacts } from "@/lib/document-reader";
import { checkUpload, storeImage } from "@/lib/uploads";

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
  const fullName = String(formData.get("fullName") ?? "").replace(/\s+/g, " ").trim();
  const documentNumber = String(formData.get("documentNumber") ?? "").trim();
  if (!title) return { error: "Name the document." } as const;
  if (title.length > 80) return { error: "Name must be 80 characters or fewer." } as const;
  if (!isPersonalDocumentKind(kind)) return { error: "Choose a document type." } as const;
  if (fullName.length > 120) return { error: "Full name must be 120 characters or fewer." } as const;
  if (documentNumber.length > 40) return { error: "Document number must be 40 characters or fewer." } as const;
  const issued = readOptionalDate(formData.get("issuedOn"), "Issue date");
  if (issued.error) return { error: issued.error } as const;
  const expires = readOptionalDate(formData.get("expiresOn"), "Expiry date");
  if (expires.error) return { error: expires.error } as const;
  if (issued.date && expires.date && expires.date < issued.date) {
    return { error: "Expiry date must be on or after the issue date." } as const;
  }
  return {
    title,
    kind,
    fullName: fullName || null,
    documentNumber: documentNumber || null,
    issuedOn: issued.date,
    expiresOn: expires.date,
  } as const;
}

/** Read the holder's name, number and dates from an uploaded document so the form can be filled in before saving. */
export async function scanPersonalDocument(
  formData: FormData,
): Promise<{ status: "read"; facts: DocumentFacts } | { status: "unavailable" } | { status: "error"; error: string }> {
  await requireUser();
  const checked = checkUpload(formData.get("file"), { allowPdf: true });
  if (checked.status === "empty") return { status: "error", error: "Choose a file." };
  if (checked.status === "invalid") return { status: "error", error: checked.error };
  if (!documentReaderConfigured()) return { status: "unavailable" };

  const facts = await readDocumentFacts(new Uint8Array(await checked.file.arrayBuffer()), checked.file.type);
  if (!facts) return { status: "error", error: "Couldn't read the document. Fill in the details yourself." };
  return { status: "read", facts };
}

export async function createPersonalDocument(_: unknown, formData: FormData) {
  const user = await requireUser();
  const details = readDetails(formData);
  if ("error" in details) return details;

  const stored = await storeImage(formData.get("file"), `identity/${user.id}`, { allowPdf: true });
  if ("empty" in stored) return { error: "Choose a file." };
  if ("error" in stored) return stored;

  await prisma.personalDocument.create({
    data: {
      userId: user.id,
      title: details.title,
      kind: details.kind,
      fullName: details.fullName,
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

  const stored = await storeImage(formData.get("file"), `identity/${user.id}`, { allowPdf: true });
  if ("error" in stored) return stored;

  await prisma.personalDocument.update({
    where: { id: document.id },
    data: {
      title: details.title,
      kind: details.kind,
      fullName: details.fullName,
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
