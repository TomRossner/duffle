"use server";

import { getT } from "@/i18n/server";
import { revalidatePath } from "next/cache";
import {
  BUDGET_TABLE_CATEGORY,
  currencyInMatrix,
  tablesFromMatrix,
} from "@/lib/budget-sheet";
import { readWorkbook, type CheckedTable, type ImportSheet } from "@/lib/budget-import";
import { importBudgetWithAgent } from "@/lib/budget-import-agent";
import { CURRENCIES } from "@/lib/constants";
import { formatDate, parseDate } from "@/lib/dates";
import { createExpenseRecord } from "@/lib/expenses";
import { notifyTrip } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

function isCurrency(value: string) {
  return (CURRENCIES as readonly string[]).includes(value);
}

async function nextTableOrder(tripId: string) {
  const latest = await prisma.budgetTable.findFirst({
    where: { tripId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (latest?.sortOrder ?? -1) + 1;
}

export async function createBudgetTable(tripId: string, _: unknown, formData: FormData) {
  const t = await getT("money");
  await requireTrip(tripId);
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { baseCurrency: true } });
  if (!trip) return { error: t("errors.tripNotFound") };
  const currency = String(formData.get("currency") ?? trip.baseCurrency).toUpperCase();
  if (!isCurrency(currency)) return { error: t("errors.chooseCurrency") };
  const typedTitle = String(formData.get("title") ?? "").trim();
  const title = (typedTitle || "Budget table").slice(0, 80);

  await prisma.budgetTable.create({
    data: {
      tripId,
      title,
      kind: "CUSTOM",
      currency,
      sortOrder: await nextTableOrder(tripId),
    },
  });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function deleteBudgetTable(tripId: string, tableId: string) {
  const t = await getT("money");
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: t("errors.tableNotFound") };
  await prisma.budgetTable.delete({ where: { id: tableId } });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

async function rowFields(tripId: string, formData: FormData) {
  const t = await getT("money");
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const note = String(formData.get("note") ?? "").trim();
  const paidById = String(formData.get("paidById") ?? "");
  if (!label) return { error: t("errors.nameRow") };
  if (!Number.isFinite(amount) || amount <= 0) return { error: t("errors.amountPositive") };
  if (startDate && endDate && endDate < startDate) return { error: t("errors.endBeforeStart") };
  if (paidById) {
    const members = await acceptedMembers(tripId);
    if (!members.some((member) => member.userId === paidById)) return { error: t("errors.choosePayer") };
  }
  return {
    data: {
      label: label.slice(0, 120),
      amount,
      note: note ? note.slice(0, 200) : null,
      startDate,
      endDate,
      paidById: paidById || null,
    },
  };
}

export async function addBudgetRow(tripId: string, tableId: string, _: unknown, formData: FormData) {
  const t = await getT("money");
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: t("errors.tableNotFound") };
  const fields = await rowFields(tripId, formData);
  if ("error" in fields) return fields;

  const latest = await prisma.budgetRow.findFirst({
    where: { tableId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.budgetRow.create({
    data: {
      tableId,
      ...fields.data,
      sortOrder: (latest?.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function updateBudgetRow(tripId: string, rowId: string, _: unknown, formData: FormData) {
  const t = await getT("money");
  await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    select: { id: true },
  });
  if (!row) return { error: t("errors.rowNotFound") };
  const fields = await rowFields(tripId, formData);
  if ("error" in fields) return fields;
  await prisma.budgetRow.update({ where: { id: rowId }, data: fields.data });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function updateBudgetTable(tripId: string, tableId: string, _: unknown, formData: FormData) {
  const t = await getT("money");
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: t("errors.tableNotFound") };
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { baseCurrency: true } });
  if (!trip) return { error: t("errors.tripNotFound") };
  const currency = String(formData.get("currency") ?? trip.baseCurrency).toUpperCase();
  if (!isCurrency(currency)) return { error: t("errors.chooseCurrency") };
  const typedTitle = String(formData.get("title") ?? "").trim();
  const title = (typedTitle || "Budget table").slice(0, 80);
  await prisma.budgetTable.update({
    where: { id: tableId },
    data: { title, currency },
  });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function deleteBudgetRow(tripId: string, rowId: string) {
  const t = await getT("money");
  await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    select: { id: true },
  });
  if (!row) return { error: t("errors.rowNotFound") };
  await prisma.budgetRow.delete({ where: { id: rowId } });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function addBudgetRowToPlan(tripId: string, rowId: string) {
  const t = await getT("money");
  const { user } = await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    include: { table: true },
  });
  if (!row) return { error: t("errors.rowNotFound") };
  if (row.expenseId) return { error: t("errors.alreadyPlanned") };
  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: t("errors.amountPositive") };

  const [trip, members] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId }, select: { startDate: true } }),
    acceptedMembers(tripId),
  ]);
  if (!trip) return { error: t("errors.tripNotFound") };
  const memberIds = members.map((member) => member.userId);
  const created = await createExpenseRecord({
    tripId,
    phase: "PLANNED",
    category: BUDGET_TABLE_CATEGORY[row.table.kind],
    title: row.label,
    amount,
    currency: row.table.currency,
    date: row.startDate ?? trip.startDate,
    notes: row.note,
    paidById: user.id,
    splitType: "EQUAL",
    participantIds: memberIds,
    inputs: [],
    manualRate: null,
    memberIds,
  });
  if ("error" in created) return created;

  const linked = await prisma.budgetRow.updateMany({
    where: { id: row.id, expenseId: null },
    data: { expenseId: created.expense.id },
  });
  if (linked.count === 0) {
    await prisma.expense.delete({ where: { id: created.expense.id } });
    return { error: t("errors.alreadyPlanned") };
  }

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    message: "budgetRowAdded",
    values: { name: user.name ?? "", item: row.label },
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}

export async function importBudgetWorkbook(tripId: string, _: unknown, formData: FormData) {
  const t = await getT("money");
  const { user } = await requireTrip(tripId);
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { baseCurrency: true, startDate: true, endDate: true },
  });
  if (!trip) return { error: t("errors.tripNotFound") };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: t("errors.chooseFile") };
  if (file.size > 2_000_000) return { error: t("errors.fileTooLarge") };
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) return { error: t("errors.fileType") };

  let matrices: ImportSheet[];
  try {
    matrices = readWorkbook(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return { error: t("errors.fileUnreadable") };
  }

  // The agent reads the workbook first; the box reader covers a gateway that is off or fails.
  const members = await acceptedMembers(tripId);
  const fromAgent = await importBudgetWithAgent(matrices, {
    baseCurrency: trip.baseCurrency,
    tripStart: formatDate(trip.startDate),
    tripEnd: formatDate(trip.endDate),
    travelers: members.map((member) => ({ id: member.userId, name: member.user.name ?? member.user.email })),
  });

  const year = trip.startDate.getUTCFullYear();
  const imported: CheckedTable[] =
    fromAgent ??
    matrices.flatMap((sheet) =>
      tablesFromMatrix(sheet.matrix, year, sheet.name).map((table) => {
        const currency = currencyInMatrix(sheet.matrix) ?? trip.baseCurrency;
        return {
          ...table,
          currency: isCurrency(currency) ? currency : trip.baseCurrency,
          rows: table.rows.map((row) => ({ ...row, paidById: null })),
        };
      }),
    );
  if (imported.length === 0) return { error: t("errors.noTables") };

  let sortOrder = await nextTableOrder(tripId);
  await prisma.$transaction(
    imported.map((table) => {
      const order = sortOrder;
      sortOrder += 1;
      return prisma.budgetTable.create({
        data: {
          tripId,
          title: table.title,
          kind: table.kind,
          currency: table.currency,
          sortOrder: order,
          rows: {
            create: table.rows.map((row, index) => ({
              label: row.label,
              amount: row.amount,
              note: row.note,
              startDate: row.startDate,
              endDate: row.endDate,
              paidById: row.paidById,
              sortOrder: index,
            })),
          },
        },
      });
    }),
  );

  revalidatePath(`/trips/${tripId}/money`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    message: "budgetImported",
    values: { name: user.name ?? "", count: imported.length },
    href: `/trips/${tripId}/money`,
  });
  return { ok: true, count: imported.length };
}
