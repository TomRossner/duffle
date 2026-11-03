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

The workbook is given as sheets of addressed cells: each line is a spreadsheet row number, then the filled cells as COLUMN=value. Strings are quoted; dates are YYYY-MM-DD.

Read the whole workbook, work out what it contains, then call saveTables once with every table. If the tool reports problems, fix them and call it again.

How to build the tables:
- Make one table per group of costs. A group can be a separate block of cells, a separate sheet, or a category column (for example rows tagged "Flight", "Hotel", "Food" become one table each). Don't split one list into tiny tables without a reason, and don't merge unrelated lists.
- kind is FLIGHT for flights, LODGING for hotels, apartments and other stays, CAR for car rental, and CUSTOM for everything else.
- title is short and in the workbook's language, taken from a heading, sheet name or category when there is one.
- currency is the ISO code for the amounts, from symbols, headings or currency columns. If nothing says, use the trip's base currency. Use only these codes: ${CURRENCIES.join(", ")}. A table holds one currency; split a list whose rows use different currencies.
- Each row is one cost: label names it, amount is the cost as a positive number in the table's currency.
- Leave out headings, blank rows, subtotals, totals, and rows without a cost. If a row has a unit price and a quantity, or a nightly rate and a number of nights, use the full cost when the sheet shows it, otherwise multiply.
- startDate and endDate are YYYY-MM-DD for the dates the cost covers (a stay's check-in and check-out, a flight's day). Use the trip's year when the sheet gives a day and month only. Use null when there are no dates.
- note keeps other useful details from the row, such as a booking number, a location, or a flight number, in a few words. Use null when there is nothing to add.
- paidById is a traveler id from the travelers list, only when the row clearly names that traveler as the payer. Otherwise null.
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
              note: z.string().nullable().describe("Other useful details, or null."),
              startDate: z.string().nullable().describe("YYYY-MM-DD, or null."),
              endDate: z.string().nullable().describe("YYYY-MM-DD, or null."),
              paidById: z.string().nullable().describe("Traveler id of the payer, or null."),
            }),
          )
          .max(200),
      }),
    )
    .max(20),
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

  try {
    const tables = await runImportAgent(workbook, context);
    return tables && tables.length > 0 ? tables : null;
  } catch (error) {
    console.error("Budget import agent failed, using the box reader.", error instanceof Error ? error.message : error);
    return null;
  }
}

async function runImportAgent(workbook: string, context: ImportContext) {
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
    timeout: { totalMs: 50_000 },
  });

  return saved as CheckedTable[] | null;
}
