import type { ExpenseCategory } from "@prisma/client";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";

export const BUDGET_TABLE_KINDS = ["FLIGHT", "LODGING", "CAR", "CUSTOM"] as const;
export type BudgetTableKind = (typeof BUDGET_TABLE_KINDS)[number];

export const BUDGET_TABLE_LABELS: Record<BudgetTableKind, string> = {
  FLIGHT: "Flights",
  LODGING: "Lodging",
  CAR: "Car rental",
  CUSTOM: "Custom",
};

export const BUDGET_TABLE_CATEGORY: Record<BudgetTableKind, ExpenseCategory> = {
  FLIGHT: "FLIGHT",
  LODGING: "STAY",
  CAR: "TRANSPORT",
  CUSTOM: "OTHER",
};

export type SheetCell = string | number | boolean | Date | null;

export type ImportedRow = {
  label: string;
  amount: number;
  note: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

export type ImportedTable = {
  title: string;
  kind: BudgetTableKind;
  rows: ImportedRow[];
};

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function filled(cell: SheetCell | undefined) {
  if (cell == null || cell === false || cell === true) return false;
  if (typeof cell === "string") return cell.trim().length > 0;
  if (typeof cell === "number") return Number.isFinite(cell);
  return !Number.isNaN(cell.getTime());
}

export function amountOf(cell: SheetCell | undefined) {
  if (typeof cell === "number" && Number.isFinite(cell)) return roundMoney(cell);
  if (typeof cell !== "string") return null;
  const stripped = cell.trim().replace(/[₪€£$\s]/g, "");
  if (!stripped || /[a-zA-Z\u0590-\u05FF]/.test(stripped)) return null;
  const normalized = stripped.replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? roundMoney(value) : null;
}

function textOf(cell: SheetCell | undefined) {
  if (typeof cell !== "string") return "";
  // Some sheets carry invisible direction marks after names.
  return cell.replace(/[‎‏‪-‮]/g, "").trim();
}

/** Check marks and yes/no flags say a feature exists; they make noise in a note. */
function isFlag(text: string) {
  return /^(ü|û|✓|✔|✗|✘|x|v|yes|no|y|n|true|false|כן|לא)$/i.test(text);
}

function dateOnly(value: Date) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

function utcDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function datesFromText(value: string, year: number) {
  const range = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})/.exec(value);
  if (range) {
    const month = MONTHS[range[3].toLowerCase()];
    if (!month) return null;
    const start = utcDate(year, month, Number(range[1]));
    let end = utcDate(year, month, Number(range[2]));
    if (start && end && end < start) end = utcDate(year, month + 1, Number(range[2]));
    if (!start || !end) return null;
    return { start, end };
  }
  const single = /^(\d{1,2})\s+([A-Za-z]{3,9})$/.exec(value.trim());
  if (!single) return null;
  const month = MONTHS[single[2].toLowerCase()];
  if (!month) return null;
  const start = utcDate(year, month, Number(single[1]));
  return start ? { start, end: start } : null;
}

const TOTAL_HEADER = /overall|total|sum|סה|סך/i;
const PRICE_HEADER = /price|cost|amount|fee|rate|מחיר|עלות|סכום/i;
const INDEX_HEADER = /^\s*(#|no\.?|num(ber)?|index|id|יום|מס)\s*$|\bday\s*(#|no\b)/i;

/** A column of 1, 2, 3... counts rows; it is not money. */
function isCounter(values: number[]) {
  return values.length >= 3 && values.every((value, index) => index === 0 || value === values[index - 1] + 1);
}

function looksLikeTotal(text: string) {
  return /total|overall|sum|סה|סך/i.test(text);
}

/** A short cell such as "Total:", "Overall (ISK):" or "סה״כ" marks a total row anywhere in a table. */
function isTotalCell(text: string) {
  return text.length <= 30 && /^((grand|sub)\s*)?(total|overall|sum)\b|^(סה|סך)/i.test(text);
}

type Box = { minR: number; maxR: number; minC: number; maxC: number };

function boxesFromMatrix(matrix: SheetCell[][]) {
  const height = Math.min(matrix.length, 200);
  const width = Math.min(
    40,
    matrix.reduce((max, row) => Math.max(max, row?.length ?? 0), 0),
  );
  const seen = new Set<string>();
  const boxes: Box[] = [];
  const neighbors = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((col) => [row, col] as const)).filter(([row, col]) => row || col);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const start = `${row},${col}`;
      if (seen.has(start) || !filled(matrix[row]?.[col])) continue;
      const queue = [[row, col]];
      seen.add(start);
      const box: Box = { minR: row, maxR: row, minC: col, maxC: col };
      let count = 0;
      while (queue.length > 0) {
        const [currentRow, currentCol] = queue.pop()!;
        count += 1;
        box.minR = Math.min(box.minR, currentRow);
        box.maxR = Math.max(box.maxR, currentRow);
        box.minC = Math.min(box.minC, currentCol);
        box.maxC = Math.max(box.maxC, currentCol);
        for (const [dRow, dCol] of neighbors) {
          const nextRow = currentRow + dRow;
          const nextCol = currentCol + dCol;
          const key = `${nextRow},${nextCol}`;
          if (nextRow < 0 || nextCol < 0 || nextRow >= height || nextCol >= width || seen.has(key)) continue;
          if (!filled(matrix[nextRow]?.[nextCol])) continue;
          seen.add(key);
          queue.push([nextRow, nextCol]);
        }
      }
      if (count >= 2) boxes.push(box);
    }
  }

  return boxes.sort((a, b) => a.minR - b.minR || a.minC - b.minC);
}

function parseBox(matrix: SheetCell[][], box: Box, year: number, sheetName: string): ImportedTable | null {
  const rows: SheetCell[][] = [];
  for (let row = box.minR; row <= box.maxR; row += 1) {
    const line: SheetCell[] = [];
    for (let col = box.minC; col <= box.maxC; col += 1) line.push(matrix[row]?.[col] ?? null);
    rows.push(line);
  }

  const columnCount = box.maxC - box.minC + 1;
  // Leading rows without amounts are headers; a merged or grouped header can take two or three rows.
  let headerRows = 0;
  while (
    headerRows < Math.min(3, rows.length - 1) &&
    rows[headerRows].every((cell) => amountOf(cell) == null) &&
    rows[headerRows].some((cell) => textOf(cell))
  ) {
    headerRows += 1;
  }
  const headerOf = (col: number) =>
    rows
      .slice(0, headerRows)
      .map((row) => textOf(row[col]))
      .join(" ");

  let amountCol = -1;
  let amountScore = -Infinity;
  for (let col = 0; col < columnCount; col += 1) {
    const values = rows.map((row) => amountOf(row[col])).filter((value): value is number => value != null);
    if (values.length === 0) continue;
    if (values.every((value) => Number.isInteger(value) && value >= 1900 && value <= 2100)) continue;
    const heading = headerOf(col);
    if (INDEX_HEADER.test(heading) || isCounter(values)) continue;
    // A named total beats a named price, which beats an unnamed column; ties go to more values, then the rightmost.
    const score = (TOTAL_HEADER.test(heading) ? 2000 : PRICE_HEADER.test(heading) ? 1000 : 0) + values.length;
    if (score > amountScore || (score === amountScore && col > amountCol)) {
      amountScore = score;
      amountCol = col;
    }
  }
  if (amountCol < 0) return null;

  const header = headerRows > 0;
  const data = rows.slice(headerRows);
  const amounts = data.map((row) => amountOf(row[amountCol])).filter((value): value is number => value != null);
  const sumAboveLast = roundMoney(amounts.slice(0, -1).reduce((total, value) => total + value, 0));
  const last = data[data.length - 1];
  const lastAmount = last ? amountOf(last[amountCol]) : null;
  const lastText = last ? last.map((cell) => textOf(cell)).filter(Boolean).join(" ") : "";
  const dropTotal =
    lastAmount != null &&
    (looksLikeTotal(lastText) || (Math.abs(lastAmount - sumAboveLast) <= 0.5 && sumAboveLast > 0));
  const body = dropTotal ? data.slice(0, -1) : data;

  const imported: ImportedRow[] = [];
  for (const row of body) {
    const amount = amountOf(row[amountCol]);
    if (amount == null) continue;
    if (row.some((cell) => isTotalCell(textOf(cell)))) continue;
    const texts: string[] = [];
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    row.forEach((cell, index) => {
      if (index === amountCol) return;
      if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
        const date = dateOnly(cell);
        if (!startDate) startDate = date;
        else if (!endDate) endDate = date;
        return;
      }
      const text = textOf(cell);
      if (!text) return;
      const parsed = datesFromText(text, year);
      if (parsed && !startDate) {
        startDate = parsed.start;
        endDate = parsed.end;
        return;
      }
      if (isFlag(text) || texts.includes(text)) return;
      texts.push(text);
    });
    imported.push({
      label: (texts[0] || "Item").slice(0, 120),
      amount,
      note: texts.slice(1).join(" · ").replace(/\s+/g, " ").slice(0, 200) || null,
      startDate,
      endDate,
    });
  }
  if (imported.length === 0) return null;
  // A block of bare numbers, such as totals sitting apart from their labels, is not a table.
  if (!header && imported.every((row) => row.label === "Item" && !row.note && !row.startDate)) return null;

  // A short heading names the table; a row of column names does not.
  const headerCells = (header ? rows[0] : []).map((cell) => textOf(cell)).filter(Boolean);
  const headerText = headerCells.length <= 2 ? headerCells.join(" ").trim() : "";
  const title = (headerText || sheetName || "Budget table").slice(0, 80);

  return { title, kind: "CUSTOM" as const, rows: imported };
}

export function currencyInMatrix(matrix: SheetCell[][]) {
  const text = matrix.flat().filter((cell): cell is string => typeof cell === "string").join(" ");
  // Count each currency's code and symbol, and take the one named most often:
  // "(ISK)" in every header beats "110 ILS" in one comment.
  let best: string | null = null;
  let bestCount = 0;
  for (const code of CURRENCIES) {
    const symbol = CURRENCY_SYMBOLS[code];
    let count = text.match(new RegExp(`\\b${code}\\b`, "g"))?.length ?? 0;
    if (code === "USD") count += text.match(/(^|[^A-Z])\$/g)?.length ?? 0;
    else if (code === "ILS") count += text.match(/₪|ש״ח|ש"ח/g)?.length ?? 0;
    else if (/^[^\w\s]$/.test(symbol)) count += text.split(symbol).length - 1;
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

export function tablesFromMatrix(matrix: SheetCell[][], year: number, sheetName = "") {
  return boxesFromMatrix(matrix)
    .map((box) => parseBox(matrix, box, year, sheetName))
    .filter((table): table is ImportedTable => table != null)
    .slice(0, 20);
}
