"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import {
  BUDGET_TABLE_CATEGORY,
  currencyInMatrix,
  tablesFromMatrix,
  type SheetCell,
} from "@/lib/budget-sheet";
import { CURRENCIES } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
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
  await requireTrip(tripId);
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { baseCurrency: true } });
  if (!trip) return { error: "Trip not found." };
  const currency = String(formData.get("currency") ?? trip.baseCurrency).toUpperCase();
  if (!isCurrency(currency)) return { error: "Choose a currency." };
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
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: "Table not found." };
  await prisma.budgetTable.delete({ where: { id: tableId } });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

async function rowFields(tripId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const note = String(formData.get("note") ?? "").trim();
  const paidById = String(formData.get("paidById") ?? "");
  if (!label) return { error: "Name this row." as const };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than zero." as const };
  if (startDate && endDate && endDate < startDate) return { error: "The end date is before the start date." as const };
  if (paidById) {
    const members = await acceptedMembers(tripId);
    if (!members.some((member) => member.userId === paidById)) return { error: "Choose who paid." as const };
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
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: "Table not found." };
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
  await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    select: { id: true },
  });
  if (!row) return { error: "Row not found." };
  const fields = await rowFields(tripId, formData);
  if ("error" in fields) return fields;
  await prisma.budgetRow.update({ where: { id: rowId }, data: fields.data });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function updateBudgetTable(tripId: string, tableId: string, _: unknown, formData: FormData) {
  await requireTrip(tripId);
  const table = await prisma.budgetTable.findFirst({ where: { id: tableId, tripId }, select: { id: true } });
  if (!table) return { error: "Table not found." };
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { baseCurrency: true } });
  if (!trip) return { error: "Trip not found." };
  const currency = String(formData.get("currency") ?? trip.baseCurrency).toUpperCase();
  if (!isCurrency(currency)) return { error: "Choose a currency." };
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
  await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    select: { id: true },
  });
  if (!row) return { error: "Row not found." };
  await prisma.budgetRow.delete({ where: { id: rowId } });
  revalidatePath(`/trips/${tripId}/money`);
  return { ok: true };
}

export async function addBudgetRowToPlan(tripId: string, rowId: string) {
  const { user } = await requireTrip(tripId);
  const row = await prisma.budgetRow.findFirst({
    where: { id: rowId, table: { tripId } },
    include: { table: true },
  });
  if (!row) return { error: "Row not found." };
  if (row.expenseId) return { error: "This row is already a planned cost." };
  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than zero." };

  const [trip, members] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId }, select: { startDate: true } }),
    acceptedMembers(tripId),
  ]);
  if (!trip) return { error: "Trip not found." };
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
    return { error: "This row is already a planned cost." };
  }

  revalidatePath(`/trips/${tripId}`);
  await notifyTrip(tripId, user.id, {
    kind: "EXPENSE",
    title: "Planned cost added",
    body: `${user.name ?? "A traveler"} added ${row.label} from a budget sheet.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}

function sheetMatrices(buffer: Buffer) {
  const book = XLSX.read(buffer, { type: "buffer", cellDates: true });
  return book.SheetNames.slice(0, 5).map((name) => {
    const rows = XLSX.utils.sheet_to_json<SheetCell[]>(book.Sheets[name], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    });
    return {
      name: name.replace(/^Sheet\d+$/i, "").trim(),
      matrix: rows.slice(0, 200).map((row) => (Array.isArray(row) ? row.slice(0, 40) : [])),
    };
  });
}

export async function importBudgetWorkbook(tripId: string, _: unknown, formData: FormData) {
  const { user } = await requireTrip(tripId);
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { baseCurrency: true, startDate: true },
  });
  if (!trip) return { error: "Trip not found." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel file." };
  if (file.size > 2_000_000) return { error: "That file is larger than 2MB." };
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) return { error: "Upload an .xlsx or .xls file." };

  let matrices: { name: string; matrix: SheetCell[][] }[];
  try {
    matrices = sheetMatrices(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "That file could not be read as a spreadsheet." };
  }

  const year = trip.startDate.getUTCFullYear();
  const imported = matrices.flatMap((sheet) =>
    tablesFromMatrix(sheet.matrix, year, sheet.name).map((table) => ({
      ...table,
      currency: currencyInMatrix(sheet.matrix) ?? trip.baseCurrency,
    })),
  );
  if (imported.length === 0) return { error: "No amount tables were found in that file." };

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
          currency: isCurrency(table.currency) ? table.currency : trip.baseCurrency,
          sortOrder: order,
          rows: {
            create: table.rows.map((row, index) => ({
              label: row.label,
              amount: row.amount,
              note: row.note,
              startDate: row.startDate,
              endDate: row.endDate,
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
    title: "Budget sheet imported",
    body: `${user.name ?? "A traveler"} imported ${imported.length} budget ${imported.length === 1 ? "table" : "tables"}.`,
    href: `/trips/${tripId}/money`,
  });
  return { ok: true };
}
