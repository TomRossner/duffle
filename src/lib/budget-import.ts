// Helpers for the Excel import: read the workbook, turn it into prompt text, and check the tables the agent proposes.
// Kept free of `@/` imports so `node --test` can load it directly.
import * as XLSX from "xlsx";

export type ImportCell = string | number | boolean | Date | null;

export type ImportSheet = {
  name: string;
  matrix: ImportCell[][];
  /** Zero-based sheet row and column of matrix[0][0], so prompt addresses match Excel's. */
  firstRow?: number;
  firstCol?: number;
  /** Formulas by matrix position, keyed `row,col`. */
  formulas?: Record<string, string>;
};

const MAX_SHEETS = 5;
const MAX_ROWS = 200;
const MAX_COLS = 40;

/**
 * Read up to five sheets. A merged cell's value is copied into every cell it covers, so a
 * two-row header such as "Parking" over "Price" still names the price column below it.
 */
export function readWorkbook(buffer: Uint8Array): ImportSheet[] {
  const book = XLSX.read(buffer, { type: "buffer", cellDates: true, cellFormula: true });
  return book.SheetNames.slice(0, MAX_SHEETS).map((name) => {
    const sheet = book.Sheets[name];
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
    const rows = XLSX.utils.sheet_to_json<ImportCell[]>(sheet, { header: 1, raw: true, defval: null, blankrows: true });
    const matrix = rows.slice(0, MAX_ROWS).map((row) => (Array.isArray(row) ? row.slice(0, MAX_COLS) : []));

    for (const merge of sheet["!merges"] ?? []) {
      const value = matrix[merge.s.r - range.s.r]?.[merge.s.c - range.s.c];
      if (value == null) continue;
      for (let row = merge.s.r - range.s.r; row <= merge.e.r - range.s.r && row < matrix.length; row += 1) {
        if (row < 0) continue;
        for (let col = merge.s.c - range.s.c; col <= merge.e.c - range.s.c && col < MAX_COLS; col += 1) {
          if (col >= 0 && matrix[row][col] == null) matrix[row][col] = value;
        }
      }
    }

    const formulas: Record<string, string> = {};
    for (const [address, cell] of Object.entries(sheet)) {
      if (address.startsWith("!") || !cell?.f) continue;
      const { r, c } = XLSX.utils.decode_cell(address);
      const row = r - range.s.r;
      const col = c - range.s.c;
      if (row >= 0 && row < MAX_ROWS && col >= 0 && col < MAX_COLS) formulas[`${row},${col}`] = String(cell.f).slice(0, 120);
    }

    return {
      name: name.replace(/^Sheet\d+$/i, "").trim(),
      matrix,
      firstRow: range.s.r,
      firstCol: range.s.c,
      formulas,
    };
  });
}

export const IMPORT_TABLE_KINDS = ["FLIGHT", "LODGING", "CAR", "CUSTOM"] as const;
export type ImportTableKind = (typeof IMPORT_TABLE_KINDS)[number];

export type ProposedRow = {
  label: string;
  amount: number;
  note?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  paidById?: string | null;
};

export type ProposedTable = {
  title: string;
  kind: ImportTableKind;
  currency: string;
  rows: ProposedRow[];
};

export type CheckedTable = {
  title: string;
  kind: ImportTableKind;
  currency: string;
  rows: {
    label: string;
    amount: number;
    note: string | null;
    startDate: Date | null;
    endDate: Date | null;
    paidById: string | null;
  }[];
};

const PROMPT_CHAR_LIMIT = 60_000;
const MAX_TABLES = 20;
const MAX_TABLE_ROWS = 200;

function columnName(index: number) {
  let name = "";
  let rest = index;
  do {
    name = String.fromCharCode(65 + (rest % 26)) + name;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return name;
}

function cellText(cell: ImportCell) {
  if (cell == null) return "";
  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) return "";
    // sheet_to_json returns a date-only cell as local midnight; read it back the same way.
    const month = String(cell.getMonth() + 1).padStart(2, "0");
    const day = String(cell.getDate()).padStart(2, "0");
    return `${cell.getFullYear()}-${month}-${day}`;
  }
  if (typeof cell === "number") return Number.isFinite(cell) ? String(Math.round(cell * 10_000) / 10_000) : "";
  if (typeof cell === "boolean") return cell ? "TRUE" : "FALSE";
  // Strip direction marks that some sheets carry after names.
  return cell.replace(/[‎‏‪-‮]/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}

/**
 * Write each sheet as addressed, non-empty cells, e.g. `7: D="Hotel" | Q=420 (=F7+H7)`.
 * Rows and columns use the sheet's own numbering. Returns null when nothing is filled.
 */
export function sheetsForPrompt(sheets: ImportSheet[]) {
  const parts: string[] = [];
  let length = 0;
  for (const [index, sheet] of sheets.entries()) {
    const lines: string[] = [];
    const firstRow = sheet.firstRow ?? 0;
    const firstCol = sheet.firstCol ?? 0;
    sheet.matrix.forEach((row, rowIndex) => {
      const cells = row
        .map((cell, col) => {
          const text = cellText(cell);
          if (!text) return null;
          const value = typeof cell === "string" ? JSON.stringify(text) : text;
          const formula = sheet.formulas?.[`${rowIndex},${col}`];
          return `${columnName(firstCol + col)}=${value}${formula ? ` (=${formula})` : ""}`;
        })
        .filter((cell): cell is string => cell != null);
      if (cells.length > 0) lines.push(`${firstRow + rowIndex + 1}: ${cells.join(" | ")}`);
    });
    if (lines.length === 0) continue;
    const block = `## Sheet ${index + 1}: ${JSON.stringify(sheet.name || `Sheet ${index + 1}`)}\n${lines.join("\n")}`;
    if (length + block.length > PROMPT_CHAR_LIMIT) {
      parts.push(block.slice(0, Math.max(0, PROMPT_CHAR_LIMIT - length)) + "\n[truncated]");
      break;
    }
    parts.push(block);
    length += block.length;
  }
  return parts.length > 0 ? parts.join("\n\n") : null;
}

function isoDate(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function cleanText(value: string | null | undefined, limit: number) {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  return text ? text.slice(0, limit) : null;
}

/**
 * Check the agent's tables against what the database accepts.
 * Problems come back as one message the agent can act on, so it can call the tool again.
 */
export function checkProposedTables(
  tables: ProposedTable[],
  { currencies, memberIds }: { currencies: readonly string[]; memberIds: readonly string[] },
): { ok: true; tables: CheckedTable[] } | { ok: false; error: string } {
  const problems: string[] = [];
  const members = new Set(memberIds);
  const checked: CheckedTable[] = [];

  tables.forEach((table, tableIndex) => {
    const where = `Table ${tableIndex + 1}`;
    const title = cleanText(table.title, 80);
    const currency = table.currency?.trim().toUpperCase() ?? "";
    if (!title) problems.push(`${where} needs a title.`);
    if (!currencies.includes(currency)) problems.push(`${where} has currency "${table.currency}"; use one of ${currencies.join(", ")}.`);
    if (!(IMPORT_TABLE_KINDS as readonly string[]).includes(table.kind)) problems.push(`${where} has an unknown kind.`);

    const rows: CheckedTable["rows"] = [];
    table.rows.forEach((row, rowIndex) => {
      const at = `${where}, row ${rowIndex + 1}`;
      const label = cleanText(row.label, 120);
      const amount = Math.round(Number(row.amount) * 100) / 100;
      if (!label) problems.push(`${at} needs a label.`);
      if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
        problems.push(`${at} has amount ${row.amount}; amounts must be greater than zero. Leave out rows without a cost.`);
      }
      const startDate = row.startDate ? isoDate(row.startDate) : null;
      const endDate = row.endDate ? isoDate(row.endDate) : null;
      if (row.startDate && !startDate) problems.push(`${at} has start date "${row.startDate}"; use YYYY-MM-DD or null.`);
      if (row.endDate && !endDate) problems.push(`${at} has end date "${row.endDate}"; use YYYY-MM-DD or null.`);
      if (startDate && endDate && endDate < startDate) problems.push(`${at} ends before it starts.`);
      const paidById = row.paidById?.trim() || null;
      if (paidById && !members.has(paidById)) problems.push(`${at} has paidById "${paidById}", which is not a traveler id; use null.`);
      rows.push({
        label: label ?? "",
        amount,
        note: cleanText(row.note, 200),
        startDate,
        endDate,
        paidById,
      });
    });
    if (table.rows.length === 0) problems.push(`${where} has no rows; leave it out.`);
    checked.push({ title: title ?? "", kind: table.kind, currency, rows });
  });

  if (tables.length === 0) problems.push("Save at least one table.");
  if (tables.length > MAX_TABLES) problems.push(`Save at most ${MAX_TABLES} tables; merge related ones.`);
  tables.forEach((table, index) => {
    if (table.rows.length > MAX_TABLE_ROWS) problems.push(`Table ${index + 1} has more than ${MAX_TABLE_ROWS} rows; split it.`);
  });
  if (problems.length > 0) return { ok: false, error: problems.slice(0, 20).join("\n") };
  return { ok: true, tables: checked };
}
