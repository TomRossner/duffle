// Pure helpers for the Excel import agent: turn sheets into prompt text, and check the tables it proposes.
// Kept free of `@/` imports so `node --test` can load it directly.

export type ImportCell = string | number | boolean | Date | null;

export type ImportSheet = { name: string; matrix: ImportCell[][] };

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
    // SheetJS builds dates in local time; read them back the same way.
    const month = String(cell.getMonth() + 1).padStart(2, "0");
    const day = String(cell.getDate()).padStart(2, "0");
    return `${cell.getFullYear()}-${month}-${day}`;
  }
  if (typeof cell === "number") return Number.isFinite(cell) ? String(Math.round(cell * 10_000) / 10_000) : "";
  if (typeof cell === "boolean") return cell ? "TRUE" : "FALSE";
  return cell.replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Write each sheet as addressed, non-empty cells, e.g. `3: A="Hotel" | C=420`. Returns null when nothing is filled. */
export function sheetsForPrompt(sheets: ImportSheet[]) {
  const parts: string[] = [];
  let length = 0;
  for (const [index, sheet] of sheets.entries()) {
    const lines: string[] = [];
    sheet.matrix.forEach((row, rowIndex) => {
      const cells = row
        .map((cell, col) => {
          const text = cellText(cell);
          if (!text) return null;
          return typeof cell === "string" ? `${columnName(col)}=${JSON.stringify(text)}` : `${columnName(col)}=${text}`;
        })
        .filter((cell): cell is string => cell != null);
      if (cells.length > 0) lines.push(`${rowIndex + 1}: ${cells.join(" | ")}`);
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
  if (problems.length > 0) return { ok: false, error: problems.slice(0, 20).join("\n") };
  return { ok: true, tables: checked };
}
