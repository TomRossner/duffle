"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { parseDate } from "@/lib/dates";
import { notifyTrip } from "@/lib/notify";
import { isPersonalDocumentKind } from "@/lib/personal-documents";
import { prisma } from "@/lib/prisma";
import { requireTrip, requireUser } from "@/lib/trip-access";
import { documentReaderConfigured, readDocumentFacts, type DocumentFacts } from "@/lib/document-reader";
import { checkUpload, storeImage, uploadErrorText } from "@/lib/uploads";

function readOptionalDate(value: FormDataEntryValue | null, invalid: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: null } as const;
  const date = parseDate(raw);
  if (!date) return { error: invalid } as const;
  return { date } as const;
}

function readDetails(formData: FormData, t: Translator<"documents">) {
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "OTHER");
  const fullName = String(formData.get("fullName") ?? "").replace(/\s+/g, " ").trim();
  const documentNumber = String(formData.get("documentNumber") ?? "").trim();
  if (!title) return { error: t("errors.nameDocument") } as const;
  if (title.length > 80) return { error: t("errors.nameTooLong") } as const;
  if (!isPersonalDocumentKind(kind)) return { error: t("errors.chooseType") } as const;
  if (fullName.length > 120) return { error: t("errors.fullNameTooLong") } as const;
  if (documentNumber.length > 40) return { error: t("errors.numberTooLong") } as const;
  const issued = readOptionalDate(formData.get("issuedOn"), t("errors.issueDateInvalid"));
  if (issued.error) return { error: issued.error } as const;
  const expires = readOptionalDate(formData.get("expiresOn"), t("errors.expiryDateInvalid"));
  if (expires.error) return { error: expires.error } as const;
  if (issued.date && expires.date && expires.date < issued.date) {
    return { error: t("errors.expiryBeforeIssue") } as const;
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
  const t = await getT("documents");
  const checked = checkUpload(formData.get("file"), { allowPdf: true });
  if (checked.status === "empty") return { status: "error", error: t("errors.chooseFile") };
  if (checked.status === "invalid") return { status: "error", error: await uploadErrorText(checked.error) };
  if (!documentReaderConfigured()) return { status: "unavailable" };

  const facts = await readDocumentFacts(new Uint8Array(await checked.file.arrayBuffer()), checked.file.type);
  if (!facts) return { status: "error", error: t("file.readFailed") };
  return { status: "read", facts };
}

export async function createPersonalDocument(_: unknown, formData: FormData) {
  const t = await getT("documents");
  const user = await requireUser();
  const details = readDetails(formData, t);
  if ("error" in details) return details;

  const stored = await storeImage(formData.get("file"), `identity/${user.id}`, { allowPdf: true });
  if ("empty" in stored) return { error: t("errors.chooseFile") };
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
  const t = await getT("documents");
  const user = await requireUser();
  const document = await prisma.personalDocument.findFirst({
    where: { id: documentId, userId: user.id },
    include: { attachments: { select: { tripId: true } } },
  });
  if (!document) return { error: t("errors.notFound") };

  const details = readDetails(formData, t);
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
  const t = await getT("documents");
  const user = await requireUser();
  const document = await prisma.personalDocument.findFirst({
    where: { id: documentId, userId: user.id },
    include: { attachments: { select: { tripId: true } } },
  });
  if (!document) return { error: t("errors.notFound") };

  await prisma.personalDocument.delete({ where: { id: document.id } });
  revalidatePath("/documents");
  for (const attachment of document.attachments) {
    revalidatePath(`/trips/${attachment.tripId}/documents`);
  }
  return { ok: true };
}

export async function attachPersonalDocument(tripId: string, documentId: string) {
  const t = await getT("documents");
  const { user } = await requireTrip(tripId);
  const document = await prisma.personalDocument.findFirst({ where: { id: documentId, userId: user.id } });
  if (!document) return { error: t("errors.notFound") };

  await prisma.tripDocumentAttachment.upsert({
    where: { tripId_personalDocumentId: { tripId, personalDocumentId: document.id } },
    create: { tripId, personalDocumentId: document.id },
    update: {},
  });

  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath("/documents");
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    message: "documentAdded",
    values: { name: user.name ?? "", item: document.title },
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}

export async function detachPersonalDocument(tripId: string, documentId: string) {
  const t = await getT("documents");
  const { user } = await requireTrip(tripId);
  const document = await prisma.personalDocument.findFirst({ where: { id: documentId, userId: user.id } });
  if (!document) return { error: t("errors.notFound") };

  await prisma.tripDocumentAttachment.deleteMany({
    where: { tripId, personalDocumentId: document.id },
  });

  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath("/documents");
  await notifyTrip(tripId, user.id, {
    kind: "DOCUMENT",
    message: "documentRemoved",
    values: { name: user.name ?? "", item: document.title },
    href: `/trips/${tripId}/documents`,
  });
  return { ok: true };
}
