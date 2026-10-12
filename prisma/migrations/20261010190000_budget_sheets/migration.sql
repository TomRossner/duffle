CREATE TYPE "BudgetTableKind" AS ENUM ('FLIGHT', 'LODGING', 'CAR', 'CUSTOM');

CREATE TABLE "BudgetTable" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "BudgetTableKind" NOT NULL,
    "currency" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetTable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetRow" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "expenseId" TEXT,

    CONSTRAINT "BudgetRow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetRow_expenseId_key" ON "BudgetRow"("expenseId");
CREATE INDEX "BudgetTable_tripId_idx" ON "BudgetTable"("tripId");
CREATE INDEX "BudgetRow_tableId_idx" ON "BudgetRow"("tableId");

ALTER TABLE "BudgetTable" ADD CONSTRAINT "BudgetTable_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetRow" ADD CONSTRAINT "BudgetRow_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "BudgetTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetRow" ADD CONSTRAINT "BudgetRow_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
