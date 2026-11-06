"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { createExpenseRecord, readExpenseForm, updateExpenseRecord } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { notifyTrip } from "@/lib/notify";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { CURRENCIES } from "@/lib/constants";
import { convertToBase } from "@/lib/fx";

async function memberIdsFor(tripId: string) {
  const members = await acceptedMembers(tripId);
  return members.map((member) => member.userId);
}

export async function createExpense(tripId: string, phase: "PLANNED" | "ACTUAL", _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const parsed = readExpenseForm(formData, tripId, phase);
  if ("error" in parsed) return parsed;
  const created = await createExpenseRecord({
    ...parsed.draft,
    memberIds: await memberIdsFor(tripId),
  });
  if ("error" in created) return created;
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    title: phase === "ACTUAL" ? "Expense added" : "Planned cost added",
    body: `${user.name ?? "A traveler"} added ${parsed.draft.title}.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}

export async function updateExpense(tripId: string, expenseId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!existing) return { error: "Expense not found." };
  const parsed = readExpenseForm(formData, tripId, existing.phase);
  if ("error" in parsed) return parsed;
  const updated = await updateExpenseRecord(expenseId, {
    ...parsed.draft,
    memberIds: await memberIdsFor(tripId),
  });
  if ("error" in updated) return updated;
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    title: "Expense updated",
    body: `${user.name ?? "A traveler"} updated ${parsed.draft.title}.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}

export async function deleteExpense(tripId: string, expenseId: string) {
  const { user } = await requireTrip(tripId);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!expense) return { error: "Expense not found." };
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    title: "Expense removed",
    body: `${user.name ?? "A traveler"} removed ${expense.title}.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}

export async function markExpensePaid(tripId: string, expenseId: string) {
  const { user } = await requireTrip(tripId);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!expense) return { error: "Expense not found." };
  if (expense.category === "SETTLEMENT") return { error: "A payment cannot be marked paid." };
  if (!expense.paid) {
    await prisma.expense.update({ where: { id: expenseId }, data: { paid: true } });
    revalidatePath(`/trips/${tripId}`);
    await notifyTrip(tripId, user.id, {
      kind: "EXPENSE",
      title: "Expense marked paid",
      body: `${user.name ?? "A traveler"} marked ${expense.title} as paid.`,
      href: `/trips/${tripId}/money`,
    });
  }
  return { ok: true };
}

export async function markExpenseUnpaid(tripId: string, expenseId: string) {
  const { user } = await requireTrip(tripId);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
  if (!expense) return { error: "Expense not found." };
  if (expense.paid) {
    await prisma.expense.update({ where: { id: expenseId }, data: { paid: false } });
    revalidatePath(`/trips/${tripId}`);
    await notifyTrip(tripId, user.id, {
      kind: "EXPENSE",
      title: "Expense marked unpaid",
      body: `${user.name ?? "A traveler"} marked ${expense.title} as unpaid.`,
      href: `/trips/${tripId}/money`,
    });
  }
  return { ok: true };
}

export async function createSettlement(tripId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "").toUpperCase();
  const date = parseDate(String(formData.get("date") ?? ""));
  const manualRaw = String(formData.get("manualRate") ?? "").trim();
  const manualRate = manualRaw ? Number(manualRaw) : null;
  const memberIds = await memberIdsFor(tripId);

  if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
    return { error: "Choose two travelers on this trip." };
  }
  if (fromUserId === toUserId) return { error: "A settlement needs two different people." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than zero." };
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) return { error: "Choose a currency." };
  if (!date) return { error: "Choose a date." };

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { error: "Trip not found." };
  const converted = await convertToBase(amount, currency, trip.baseCurrency, manualRate);
  if ("error" in converted) return converted;

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: fromUserId } }),
    prisma.user.findUnique({ where: { id: toUserId } }),
  ]);

  await prisma.expense.create({
    data: {
      tripId,
      phase: "ACTUAL",
      category: "SETTLEMENT",
      title: `${fromUser?.name ?? "Traveler"} paid ${toUser?.name ?? "traveler"}`,
      amount,
      currency,
      fxRate: converted.rate,
      fxDate: parseDate(converted.date) ?? date,
      amountInBase: converted.amountInBase,
      manualRate: manualRate != null && manualRate > 0 && currency !== trip.baseCurrency,
      date,
      paidById: fromUserId,
      splitType: "EXACT",
      shares: {
        create: [{ userId: toUserId, amount }],
      },
    },
  });

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    title: "Settlement recorded",
    body: `${fromUser?.name ?? "A traveler"} paid ${toUser?.name ?? "a traveler"}.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}
