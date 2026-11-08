"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { INSURANCE_TYPES } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import { createSimplePlannedExpense, deleteExpenseById, updateExpenseRecord } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { notifyTrip } from "@/lib/notify";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { checkUpload, storeImage, uploadErrorText } from "@/lib/uploads";
import { documentReaderConfigured } from "@/lib/document-reader";
import { readPolicyFacts } from "@/lib/policy-reader";

function nameWords(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** The one traveler whose name matches the insured name, ignoring order, accents, and middle names. */
function matchTraveler(insuredName: string, members: { userId: string; user: { name: string } }[]) {
  const insured = nameWords(insuredName);
  if (insured.length === 0) return null;
  const matches = members.filter((member) => {
    const words = nameWords(member.user.name);
    if (words.length === 0) return false;
    // Every word of the shorter name appears in the longer one.
    const [shorter, longer] = words.length <= insured.length ? [words, insured] : [insured, words];
    return shorter.every((word) => longer.includes(word));
  });
  return matches.length === 1 ? matches[0].userId : null;
}

/** Read an uploaded policy so the form can be filled in before saving. */
export async function scanPolicy(
  tripId: string,
  formData: FormData,
): Promise<
  | { status: "read"; facts: Record<string, string | null> }
  | { status: "unavailable" }
  | { status: "error"; error: string }
> {
  await requireTrip(tripId);
  const t = await getT("insurance");
  const checked = checkUpload(formData.get("file"), { allowPdf: true });
  if (checked.status === "empty") return { status: "error", error: t("errors.chooseFile") };
  if (checked.status === "invalid") return { status: "error", error: await uploadErrorText(checked.error) };
  if (!documentReaderConfigured()) return { status: "unavailable" };

  const facts = await readPolicyFacts(new Uint8Array(await checked.file.arrayBuffer()), checked.file.type);
  if (!facts) return { status: "error", error: t("errors.readFailed") };

  const userId = facts.insuredName ? matchTraveler(facts.insuredName, await acceptedMembers(tripId)) : null;
  return {
    status: "read",
    facts: {
      provider: facts.provider,
      type: facts.type,
      policyNumber: facts.policyNumber,
      userId,
      startDate: facts.startDate,
      endDate: facts.endDate,
      amount: facts.amount,
      currency: facts.currency,
    },
  };
}

/** "Allianz travel insurance": the planned expense's title, in the language of whoever saved it. */
async function expenseTitleFor(t: Translator<"insurance">, provider: string, type: string) {
  const label = (await getT("labels")).dynamic(`insuranceTypes.${type}`, undefined, type.toLowerCase());
  return t("expenseTitle", { provider, type: t.locale === "en" ? label.toLowerCase() : label });
}

function readPolicyForm(formData: FormData, t: Translator<"insurance">) {
  const provider = String(formData.get("provider") ?? "").trim();
  const type = String(formData.get("type") ?? "TRAVEL");
  const policyNumber = String(formData.get("policyNumber") ?? "").trim() || null;
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const insuredUserId = String(formData.get("userId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const manualRaw = String(formData.get("manualRate") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").toUpperCase();

  if (!provider) return { error: t("errors.nameInsurer") } as const;
  if (!INSURANCE_TYPES.includes(type as (typeof INSURANCE_TYPES)[number])) {
    return { error: t("errors.chooseType") } as const;
  }
  if (!startDate || !endDate) return { error: t("errors.chooseDates") } as const;
  if (endDate < startDate) return { error: t("errors.endAfterStart") } as const;

  return {
    data: { provider, type, policyNumber, startDate, endDate, notes, insuredUserId, amountRaw, manualRaw, currency },
  } as const;
}

export async function createPolicy(tripId: string, _: unknown, formData: FormData) {
  const t = await getT("insurance");
  const { user } = await requireTrip(tripId);
  const parsed = readPolicyForm(formData, t);
  if ("error" in parsed) return parsed;
  const { provider, type, policyNumber, startDate, endDate, notes, insuredUserId, amountRaw, manualRaw, currency } =
    parsed.data;

  const members = await acceptedMembers(tripId);
  if (!members.some((member) => member.userId === insuredUserId)) {
    return { error: t("errors.chooseTraveler") };
  }

  let documentId: string | undefined;
  const stored = await storeImage(formData.get("file"), `documents/${tripId}`);
  if ("error" in stored) return stored;
  if (!("empty" in stored)) {
    const document = await prisma.document.create({
      data: {
        tripId,
        userId: insuredUserId,
        title: t("documentTitle", { provider }),
        kind: "INSURANCE",
        storageKey: stored.key,
        mimeType: stored.mimeType,
      },
    });
    documentId = document.id;
  }

  let expenseId: string | undefined;
  if (amountRaw) {
    const created = await createSimplePlannedExpense({
      tripId,
      title: await expenseTitleFor(t, provider, type),
      category: "INSURANCE",
      amount: Number(amountRaw),
      currency,
      date: startDate,
      paidById: user.id,
      memberIds: [insuredUserId],
      manualRate: manualRaw ? Number(manualRaw) : null,
      notes,
    });
    if ("error" in created) return created;
    expenseId = created.expense.id;
  }

  await prisma.insurancePolicy.create({
    data: {
      tripId,
      userId: insuredUserId,
      provider,
      type,
      policyNumber,
      startDate,
      endDate,
      notes,
      documentId,
      expenseId,
    },
  });

  revalidatePath(`/trips/${tripId}/insurance`);
  await notifyTrip(tripId, user.id, {
    kind: "INSURANCE",
    message: "insuranceAdded",
    values: { name: user.name ?? "", item: provider },
    href: `/trips/${tripId}/insurance`,
  });
  return { ok: true };
}

export async function updatePolicy(tripId: string, policyId: string, _: unknown, formData: FormData) {
  const t = await getT("insurance");
  const { user } = await requireTrip(tripId);
  const parsed = readPolicyForm(formData, t);
  if ("error" in parsed) return parsed;
  const { provider, type, policyNumber, startDate, endDate, notes, insuredUserId, amountRaw, manualRaw, currency } =
    parsed.data;

  const policy = await prisma.insurancePolicy.findFirst({
    where: { id: policyId, tripId },
    include: { expense: true },
  });
  if (!policy) return { error: t("errors.notFound") };

  const members = await acceptedMembers(tripId);
  if (!members.some((member) => member.userId === insuredUserId)) {
    return { error: t("errors.chooseTraveler") };
  }

  const stored = await storeImage(formData.get("file"), `documents/${tripId}`);
  if ("error" in stored) return stored;

  let documentId = policy.documentId;
  const previousDocumentId = policy.documentId;
  const removeImage = formData.get("removeImage") === "1";
  const documentTitle = t("documentTitle", { provider });
  if (!("empty" in stored)) {
    if (policy.documentId) {
      await prisma.document.update({
        where: { id: policy.documentId },
        data: { title: documentTitle, userId: insuredUserId, storageKey: stored.key, mimeType: stored.mimeType },
      });
    } else {
      const document = await prisma.document.create({
        data: {
          tripId,
          userId: insuredUserId,
          title: documentTitle,
          kind: "INSURANCE",
          storageKey: stored.key,
          mimeType: stored.mimeType,
        },
      });
      documentId = document.id;
    }
  } else if (removeImage) {
    documentId = null;
  } else if (policy.documentId) {
    await prisma.document.update({
      where: { id: policy.documentId },
      data: { title: documentTitle, userId: insuredUserId },
    });
  }

  let expenseId = policy.expenseId;
  const expenseTitle = await expenseTitleFor(t, provider, type);
  if (amountRaw) {
    const manualRate = manualRaw ? Number(manualRaw) : null;
    if (policy.expense) {
      const updated = await updateExpenseRecord(policy.expense.id, {
        tripId,
        phase: policy.expense.phase,
        category: "INSURANCE",
        title: expenseTitle,
        amount: Number(amountRaw),
        currency,
        date: startDate,
        notes,
        paidById: policy.expense.paidById,
        splitType: "EQUAL",
        participantIds: [insuredUserId],
        inputs: [],
        manualRate,
        memberIds: members.map((member) => member.userId),
      });
      if ("error" in updated) return updated;
    } else {
      const created = await createSimplePlannedExpense({
        tripId,
        title: expenseTitle,
        category: "INSURANCE",
        amount: Number(amountRaw),
        currency,
        date: startDate,
        paidById: user.id,
        memberIds: [insuredUserId],
        manualRate,
        notes,
      });
      if ("error" in created) return created;
      expenseId = created.expense.id;
    }
  } else if (policy.expenseId) {
    await deleteExpenseById(policy.expenseId);
    expenseId = null;
  }

  await prisma.insurancePolicy.update({
    where: { id: policyId },
    data: {
      userId: insuredUserId,
      provider,
      type,
      policyNumber,
      startDate,
      endDate,
      notes,
      documentId,
      expenseId,
    },
  });

  if (!documentId && previousDocumentId) {
    const stillUsed = await prisma.insurancePolicy.count({ where: { documentId: previousDocumentId } });
    if (stillUsed === 0) await prisma.document.delete({ where: { id: previousDocumentId } }).catch(() => undefined);
  }

  revalidatePath(`/trips/${tripId}/insurance`);
  await notifyTrip(tripId, user.id, {
    kind: "INSURANCE",
    message: "insuranceUpdated",
    values: { name: user.name ?? "", item: provider },
    href: `/trips/${tripId}/insurance`,
  });
  return { ok: true };
}

export async function deletePolicy(tripId: string, policyId: string) {
  const t = await getT("insurance");
  const { user } = await requireTrip(tripId);
  const policy = await prisma.insurancePolicy.findFirst({ where: { id: policyId, tripId } });
  if (!policy) return { error: t("errors.notFound") };
  await prisma.insurancePolicy.delete({ where: { id: policyId } });
  await deleteExpenseById(policy.expenseId);
  revalidatePath(`/trips/${tripId}/insurance`);
  await notifyTrip(tripId, user.id, {
    kind: "INSURANCE",
    message: "insuranceRemoved",
    values: { name: user.name ?? "", item: policy.provider },
    href: `/trips/${tripId}/insurance`,
  });
  return { ok: true };
}
