import { neon } from "@neon/ai-sdk-provider";
import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import {
  checkProposedTables,
  IMPORT_TABLE_KINDS,
  sheetsForPrompt,
  type CheckedTable,
  type ImportSheet,
} from "@/lib/budget-import";
import { CURRENCIES } from "@/lib/constants";

const IMPORT_INSTRUCTIONS = `You turn a traveler's Excel workbook into budget tables for their trip.

The workbook is given as sheets of addressed cells: each line is a spreadsheet row number, then the filled cells as COLUMN=value. Strings are quoted, dates are YYYY-MM-DD, and a formula follows its value in parentheses. A merged cell's value is repeated in every cell it covers, so a header can span two rows: "Parking" above "Price (ISK)" means that column is the parking price. "ü", "✓", "✔", "V", "x" and "Yes" usually mark that something exists or is included.

Read the whole workbook, work out what it contains, then call saveTables once with every table. If the tool reports problems, fix them and call it again.

How to build the tables:
- Make one table per group of costs. A group can be a separate block of cells, a separate sheet, or a category column (for example rows tagged "Flight", "Hotel", "Food" become one table each). Don't split one list into tiny tables without a reason, and don't merge unrelated lists.
- kind is FLIGHT for flights, LODGING for hotels, apartments and other stays, CAR for car rental, and CUSTOM for everything else.
- title is short and in the workbook's language, taken from a heading, sheet name or category when there is one.
- currency is the ISO code for the amounts, from symbols, headings or currency columns. If nothing says, use the trip's base currency. Use only these codes: ${CURRENCIES.join(", ")}. A table holds one currency; split a list whose rows use different currencies.
- Each row is one cost: label names it, amount is the cost as a positive number in the table's currency.
- When a row breaks a cost into parts (a base price plus extras) and also has an overall or total column, usually a formula adding the parts, use that overall value as the amount and mention the main parts in the note. Don't make separate rows for the parts.
- Keep one row per sheet row; a place that repeats on several days stays several rows, one per day.
- Leave out headings, blank rows, subtotals, totals, and rows without a cost (for example a day with a date but no price). If a row has a unit price and a quantity, or a nightly rate and a number of nights, use the full cost when the sheet shows it, otherwise multiply.
- startDate and endDate are YYYY-MM-DD for the dates the cost covers. A row for one day or one night has the same startDate and endDate. Use the trip's year when the sheet gives a day and month only. Leave both out when there are no dates.
- note keeps the useful details from the row in one short sentence of at most 200 characters, such as what the price includes, a booking requirement, or a flight number. Leave it out when there is nothing to add. Don't copy links.
- paidById is a traveler id from the travelers list, only when the row clearly names that traveler as the payer. Otherwise leave it out.
- Never invent costs that are not in the workbook.`;

const saveTablesInput = z.object({
  tables: z
    .array(
      z.object({
        title: z.string().describe("Short table title."),
        kind: z.enum(IMPORT_TABLE_KINDS).describe("FLIGHT, LODGING, CAR, or CUSTOM."),
        currency: z.string().describe("ISO currency code for the amounts."),
        rows: z
          .array(
            z.object({
              label: z.string().describe("What the cost is."),
              amount: z.number().describe("Cost as a positive number."),
              // Optional rather than nullable: Gemini rejects tool schemas with nullable types.
              note: z.string().optional().describe("Other useful details. Omit when none."),
              startDate: z.string().optional().describe("YYYY-MM-DD. Omit when unknown."),
              endDate: z.string().optional().describe("YYYY-MM-DD. Omit when unknown."),
              paidById: z.string().optional().describe("Traveler id of the payer. Omit when unknown."),
            }),
          ),
      }),
    ),
  // No .max() here: Gemini rejects maxItems on nested arrays. checkProposedTables enforces the limits.
});

export function budgetImportAgentConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}

type ImportContext = {
  baseCurrency: string;
  tripStart: string;
  tripEnd: string;
  travelers: { id: string; name: string }[];
};

/** Ask the agent to build budget tables from the workbook. Returns null when it is off, fails, or finds nothing. */
export async function importBudgetWithAgent(sheets: ImportSheet[], context: ImportContext): Promise<CheckedTable[] | null> {
  if (!budgetImportAgentConfigured()) return null;
  const workbook = sheetsForPrompt(sheets);
  if (!workbook) return null;

  // A good run takes 5-15s, but the gateway sometimes stalls. Two tries stay well inside nginx's 120s read timeout.
  for (const [attempt, totalMs] of ATTEMPT_TIMEOUTS_MS.entries()) {
    try {
      const tables = await runImportAgent(workbook, context, totalMs);
      if (tables && tables.length > 0) return tables;
    } catch (error) {
      console.error(
        `Budget import agent attempt ${attempt + 1} failed.`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  console.error("Budget import agent gave no tables, using the box reader.");
  return null;
}

const ATTEMPT_TIMEOUTS_MS = [30_000, 35_000];

async function runImportAgent(workbook: string, context: ImportContext, totalMs: number) {
  let saved: CheckedTable[] | null = null;
  const modelId = process.env.BUDGET_IMPORT_AGENT_MODEL?.trim() || "gemini-3-flash";
  const memberIds = context.travelers.map((traveler) => traveler.id);

  const agent = new ToolLoopAgent({
    id: "budget-import",
    model: neon(modelId),
    instructions: IMPORT_INSTRUCTIONS,
    maxRetries: 0,
    toolChoice: "required",
    stopWhen: ({ steps }) => saved != null || steps.length >= 3,
    tools: {
      saveTables: tool({
        description: "Save the budget tables built from the workbook. Problems are reported back so you can fix them.",
        inputSchema: saveTablesInput,
        execute: async ({ tables }) => {
          const checked = checkProposedTables(tables, { currencies: CURRENCIES, memberIds });
          if (!checked.ok) return { ok: false as const, error: checked.error };
          saved = checked.tables;
          return { ok: true as const, tables: checked.tables.length };
        },
      }),
    },
  });

  await agent.generate({
    prompt: [
      `Trip: ${context.tripStart} to ${context.tripEnd}. Base currency: ${context.baseCurrency}.`,
      `Travelers: ${JSON.stringify(context.travelers)}`,
      "",
      workbook,
    ].join("\n"),
    timeout: { totalMs },
  });

  return saved as CheckedTable[] | null;
}
