ALTER TABLE "BudgetRow" ADD COLUMN "paidById" TEXT;

CREATE INDEX "BudgetRow_paidById_idx" ON "BudgetRow"("paidById");

ALTER TABLE "BudgetRow" ADD CONSTRAINT "BudgetRow_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
