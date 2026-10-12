import type { ExpenseCategory, ExpensePhase, Prisma, SplitType } from "@prisma/client";
import { parseDate } from "@/lib/dates";
import { convertToBase } from "@/lib/fx";
import { buildShares, type ShareInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/constants";

export type ExpenseDraft = {
  tripId: string;
  phase: ExpensePhase;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: string;
  date: Date;
  notes: string | null;
  paidById: string;
  splitType: SplitType;
  participantIds: string[];
  inputs: ShareInput[];
  manualRate: number | null;
  memberIds: string[];
};

export function readExpenseForm(formData: FormData, tripId: string, phase: ExpensePhase) {
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "").toUpperCase();
  const date = parseDate(String(formData.get("date") ?? ""));
  const category = String(formData.get("category") ?? "OTHER");
  const paidById = String(formData.get("paidById") ?? "");
  const splitType = String(formData.get("splitType") ?? "EQUAL");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const manualRaw = String(formData.get("manualRate") ?? "").trim();
  const manualRate = manualRaw ? Number(manualRaw) : null;
  const participantIds = formData.getAll("participant").map(String);
  const inputs = participantIds.map((userId) => ({
    userId,
    amount: Number(formData.get(`shareAmount:${userId}`) || 0),
    percent: Number(formData.get(`sharePercent:${userId}`) || 0),
  }));

  if (!title) return { error: "Add a title." } as const;
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than zero." } as const;
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    return { error: "Choose a currency." } as const;
  }
  if (!date) return { error: "Choose a date." } as const;
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number]) && category !== "SETTLEMENT") {
    return { error: "Choose a category." } as const;
  }
  if (splitType !== "EQUAL" && splitType !== "EXACT" && splitType !== "PERCENT") {
    return { error: "Choose how to split this expense." } as const;
  }

  return {
    draft: {
      tripId,
      phase,
      category: category as ExpenseCategory,
      title,
      amount,
      currency,
      date,
      notes,
      paidById,
      splitType,
      participantIds,
      inputs,
      manualRate,
      memberIds: [],
    } satisfies Omit<ExpenseDraft, "memberIds"> & { memberIds: string[] },
  } as const;
}

export async function createExpenseRecord(
  draft: ExpenseDraft,
): Promise<{ error: string } | { expense: { id: string } }> {
  if (!draft.memberIds.includes(draft.paidById)) {
    return { error: "The payer must be a traveler on this trip." } as const;
  }
  if (draft.participantIds.some((id) => !draft.memberIds.includes(id))) {
    return { error: "Every share must belong to a traveler on this trip." } as const;
  }

  const trip = await prisma.trip.findUnique({ where: { id: draft.tripId } });
  if (!trip) return { error: "Trip not found." } as const;

  const converted = await convertToBase(
    draft.amount,
    draft.currency,
    trip.baseCurrency,
    draft.manualRate,
  );
  if ("error" in converted) return converted;

  const shares = buildShares(draft.splitType, draft.amount, draft.participantIds, draft.inputs);
  if ("error" in shares) return { error: shares.error ?? "Could not split this expense." };

  const expense = await prisma.expense.create({
    data: {
      tripId: draft.tripId,
      phase: draft.phase,
      category: draft.category,
      title: draft.title,
      amount: draft.amount,
      currency: draft.currency,
      fxRate: converted.rate,
      fxDate: parseDate(converted.date) ?? draft.date,
      amountInBase: converted.amountInBase,
      manualRate: draft.manualRate != null && draft.manualRate > 0 && draft.currency !== trip.baseCurrency,
      date: draft.date,
      notes: draft.notes,
      paidById: draft.paidById,
      splitType: draft.splitType,
      shares: {
        create: shares.shares.map((share) => ({
          userId: share.userId,
          amount: share.amount,
          percent: share.percent,
        })),
      },
    },
  });

  return { expense: { id: expense.id } };
}

export async function updateExpenseRecord(
  expenseId: string,
  draft: ExpenseDraft,
): Promise<{ error: string } | { ok: true }> {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: draft.tripId },
  });
  if (!existing) return { error: "Expense not found." };
  if (!draft.memberIds.includes(draft.paidById)) {
    return { error: "The payer must be a traveler on this trip." };
  }
  if (draft.participantIds.some((id) => !draft.memberIds.includes(id))) {
    return { error: "Every share must belong to a traveler on this trip." };
  }

  const trip = await prisma.trip.findUnique({ where: { id: draft.tripId } });
  if (!trip) return { error: "Trip not found." };

  const converted = await convertToBase(draft.amount, draft.currency, trip.baseCurrency, draft.manualRate);
  if ("error" in converted) return converted;

  const shares = buildShares(draft.splitType, draft.amount, draft.participantIds, draft.inputs);
  if ("error" in shares) return { error: shares.error ?? "Could not split this expense." };

  await prisma.$transaction([
    prisma.expenseShare.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        category: draft.category,
        title: draft.title,
        amount: draft.amount,
        currency: draft.currency,
        fxRate: converted.rate,
        fxDate: parseDate(converted.date) ?? draft.date,
        amountInBase: converted.amountInBase,
        manualRate: draft.manualRate != null && draft.manualRate > 0 && draft.currency !== trip.baseCurrency,
        date: draft.date,
        notes: draft.notes,
        paidById: draft.paidById,
        splitType: draft.splitType,
        shares: {
          create: shares.shares.map((share) => ({
            userId: share.userId,
            amount: share.amount,
            percent: share.percent,
          })),
        },
      },
    }),
  ]);

  return { ok: true };
}

export async function createSimplePlannedExpense(input: {
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: Date;
  paidById: string;
  memberIds: string[];
  manualRate: number | null;
  notes?: string | null;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Cost must be greater than zero." };
  }
  if (!CURRENCIES.includes(input.currency as (typeof CURRENCIES)[number])) {
    return { error: "Choose a currency." };
  }
  return createExpenseRecord({
    tripId: input.tripId,
    phase: "PLANNED",
    category: input.category,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    date: input.date,
    notes: input.notes ?? null,
    paidById: input.paidById,
    splitType: "EQUAL",
    participantIds: input.memberIds,
    inputs: [],
    manualRate: input.manualRate,
    memberIds: input.memberIds,
  });
}

export async function deleteExpenseById(expenseId: string | null | undefined) {
  if (!expenseId) return;
  await prisma.expense.delete({ where: { id: expenseId } }).catch(() => undefined);
}

export type ExpenseWithShares = Prisma.ExpenseGetPayload<{ include: { shares: true; paidBy: true } }>;
