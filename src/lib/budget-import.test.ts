import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { checkProposedTables, readWorkbook, sheetsForPrompt, type ProposedTable } from "./budget-import.ts";

const options = { currencies: ["USD", "EUR"], memberIds: ["u1"] };

function table(overrides: Partial<ProposedTable> = {}): ProposedTable {
  return {
    title: "Hotels",
    kind: "LODGING",
    currency: "eur",
    rows: [{ label: "Hotel Roma", amount: 420.456, note: " Booking 123 ", startDate: "2026-05-01", endDate: "2026-05-04", paidById: "u1" }],
    ...overrides,
  };
}

test("sheetsForPrompt writes addressed cells and skips empty sheets", () => {
  const text = sheetsForPrompt([
    { name: "Costs", matrix: [["Item", null, "Price"], [null, null, null], ["Hotel", null, 420], ["Flight", null, 199.5]] },
    { name: "Empty", matrix: [[null]] },
  ]);
  assert.equal(text, '## Sheet 1: "Costs"\n1: A="Item" | C="Price"\n3: A="Hotel" | C=420\n4: A="Flight" | C=199.5');
  assert.equal(sheetsForPrompt([{ name: "", matrix: [] }]), null);
});

test("readWorkbook fills merged headers and keeps the sheet's own addresses and formulas", () => {
  // Shaped like a camping sheet: the table starts at B5, "Parking" spans two columns above "Price".
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Date", "Camp", "Parking", null, "Overall"],
    [null, null, "Exists", "Price", null],
    [new Date(2024, 8, 30), "Camping Thingvellir‏", "ü", 1000, 3000],
  ], { origin: "B5", cellDates: true });
  sheet.F7.f = "D7*3";
  sheet["!merges"] = [
    { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } },
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Camps");
  const bytes = XLSX.write(book, { type: "buffer", bookType: "xlsx" });

  const text = sheetsForPrompt(readWorkbook(bytes));
  assert.equal(
    text,
    [
      '## Sheet 1: "Camps"',
      '5: B="Date" | C="Camp" | D="Parking" | E="Parking" | F="Overall"',
      '6: B="Date" | D="Exists" | E="Price"',
      '7: B=2024-09-30 | C="Camping Thingvellir" | D="ü" | E=1000 | F=3000 (=D7*3)',
    ].join("\n"),
  );
});

test("sheetsForPrompt writes dates as YYYY-MM-DD", () => {
  const text = sheetsForPrompt([{ name: "", matrix: [[new Date(2026, 4, 1), "Check-in"]] }]);
  assert.equal(text, '## Sheet 1: "Sheet 1"\n1: A=2026-05-01 | B="Check-in"');
});

test("checkProposedTables cleans a valid table", () => {
  const result = checkProposedTables([table()], options);
  assert.ok(result.ok);
  const [checked] = result.tables;
  assert.equal(checked.currency, "EUR");
  assert.equal(checked.rows[0].amount, 420.46);
  assert.equal(checked.rows[0].note, "Booking 123");
  assert.equal(checked.rows[0].startDate?.toISOString().slice(0, 10), "2026-05-01");
  assert.equal(checked.rows[0].paidById, "u1");
});

test("checkProposedTables reports every problem so the agent can retry", () => {
  const result = checkProposedTables(
    [
      table({
        currency: "XYZ",
        rows: [
          { label: "", amount: 0, startDate: "May 1", endDate: null, paidById: "stranger" },
          { label: "Late", amount: 10, startDate: "2026-05-04", endDate: "2026-05-01" },
        ],
      }),
      table({ rows: [] }),
    ],
    options,
  );
  assert.ok(!result.ok);
  for (const fragment of ["currency", "row 1 needs a label", "greater than zero", '"May 1"', "stranger", "ends before", "Table 2 has no rows"]) {
    assert.match(result.error, new RegExp(fragment));
  }
});

test("checkProposedTables needs at least one table", () => {
  assert.deepEqual(checkProposedTables([], options), { ok: false, error: "Save at least one table." });
});
