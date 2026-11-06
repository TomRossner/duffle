import { Check, Wallet } from "lucide-react";
import { BalanceSummary } from "@/components/balance-summary";
import { BudgetSheets } from "@/components/budget-sheets";
import { ExpenseCategoryTag } from "@/components/expense-category";
import { ExpenseRowMenu } from "@/components/expense-editor";
import { MemberTag } from "@/components/member-tag";
import { ExpenseFormToggle, SettlementFormToggle } from "@/components/money-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createExpense, deleteExpense, markExpensePaid, markExpenseUnpaid, updateExpense } from "@/lib/actions/expenses";
import { formatDate, formatDateLong } from "@/lib/dates";
import { netBalances } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { formatMoney } from "@/lib/utils";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export default async function MoneyPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const [members, expenses, budgetTables] = await Promise.all([
    acceptedMembers(tripId),
    prisma.expense.findMany({
      where: { tripId },
      include: { shares: { include: { user: true } }, paidBy: true },
      orderBy: { date: "asc" },
    }),
    prisma.budgetTable.findMany({
      where: { tripId },
      include: { rows: { include: { paidBy: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const people = members.map((member) => ({
    id: member.userId,
    name: firstName(member.user.name),
    imageKey: member.user.imageKey,
  }));
  const planned = expenses.filter((expense) => expense.phase === "PLANNED");
  const actual = expenses.filter((expense) => expense.phase === "ACTUAL" && expense.category !== "SETTLEMENT");
  const settlements = expenses.filter((expense) => expense.category === "SETTLEMENT");
  const paidPlanned = planned.filter((expense) => expense.paid);
  const ledger = [...actual, ...paidPlanned, ...settlements].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const balances = netBalances(
    ledger.map((expense) => ({
      paidById: expense.paidById,
      amountInBase: Number(expense.amountInBase),
      fxRate: Number(expense.fxRate),
      shares: expense.shares.map((share) => ({ userId: share.userId, amount: Number(share.amount) })),
    })),
  );
  return (
    <Tabs defaultValue="planned">
      <TabsList>
        <TabsTrigger value="planned">Planned</TabsTrigger>
        <TabsTrigger value="actual">Mid-trip</TabsTrigger>
      </TabsList>
      <TabsContent value="planned" className="grid gap-6 pt-4">
        <BudgetSheets
          tripId={tripId}
          currency={trip.baseCurrency}
          members={people}
          tables={budgetTables.map((table) => ({
            id: table.id,
            title: table.title,
            currency: table.currency,
            rows: table.rows.map((row) => ({
              id: row.id,
              label: row.label,
              amount: Number(row.amount),
              note: row.note,
              startDate: row.startDate ? formatDate(row.startDate) : null,
              endDate: row.endDate ? formatDate(row.endDate) : null,
              paidBy: row.paidBy
                ? { id: row.paidBy.id, name: firstName(row.paidBy.name), imageKey: row.paidBy.imageKey }
                : null,
            })),
          }))}
        />
      </TabsContent>
      <TabsContent value="actual" className="grid gap-6 pt-4">
        <div className="grid grid-cols-2 items-start gap-2 sm:flex sm:flex-wrap">
          <ExpenseFormToggle
            label="Add a shared expense"
            description={`Amounts in other currencies are converted into ${trip.baseCurrency}.`}
            action={createExpense.bind(null, tripId, "ACTUAL")}
            members={people}
            currency={trip.baseCurrency}
            submitLabel="Add expense"
          />
          <SettlementFormToggle tripId={tripId} members={people} currency={trip.baseCurrency} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Who still needs to pay whom, in {trip.baseCurrency}.</CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceSummary currency={trip.baseCurrency} people={people} balances={balances} />
          </CardContent>
        </Card>
        <ExpenseTable tripId={tripId} currency={trip.baseCurrency} members={people} rows={ledger} />
      </TabsContent>
    </Tabs>
  );
}

function ExpenseTable({
  tripId,
  currency,
  members,
  rows,
}: {
  tripId: string;
  currency: string;
  members: { id: string; name: string; imageKey?: string | null }[];
  rows: {
    id: string;
    phase: string;
    paid: boolean;
    title: string;
    category: string;
    amount: { toString(): string };
    currency: string;
    amountInBase: { toString(): string };
    fxRate: { toString(): string };
    date: Date;
    notes: string | null;
    splitType: string;
    paidBy: { id: string; name: string; imageKey: string | null };
    manualRate: boolean;
    shares: {
      user: { id: string; name: string; imageKey: string | null };
      amount: { toString(): string };
      percent: { toString(): string } | null;
    }[];
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="size-4" />
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="max-w-full min-w-0 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Paid by</th>
            <th className="px-3 py-2 font-medium">Amount</th>
            <th className="px-3 py-2 font-medium">In {currency}</th>
            <th className="px-3 py-2 font-medium">Shares</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <td className="px-3 py-2 whitespace-nowrap">{formatDateLong(row.date)}</td>
              <td className="px-3 py-2">
                <span className="inline-flex flex-wrap items-center gap-2">
                  {row.title}
                  {row.paid ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Check aria-hidden />
                      Paid
                    </Badge>
                  ) : null}
                </span>
                {row.manualRate ? <span className="block text-xs text-muted-foreground">Manual rate</span> : null}
              </td>
              <td className="px-3 py-2">
                <ExpenseCategoryTag category={row.category} className="whitespace-nowrap" />
              </td>
              <td className="px-3 py-2">
                <MemberTag userId={row.paidBy.id} name={firstName(row.paidBy.name)} imageKey={row.paidBy.imageKey} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatMoney(Number(row.amount), row.currency)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatMoney(Number(row.amountInBase), currency)}</td>
              <td className="px-3 py-2">
                <div className="grid gap-2">
                  {row.shares.map((share) => (
                    <span key={share.user.id} className="flex items-center gap-2">
                      <MemberTag userId={share.user.id} name={firstName(share.user.name)} imageKey={share.user.imageKey} />
                      {formatMoney(Number(share.amount), row.currency)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2 text-right">
                <ExpenseRowMenu
                  title={row.title}
                  action={updateExpense.bind(null, tripId, row.id)}
                  members={members}
                  currency={currency}
                  defaults={{
                    title: row.title,
                    amount: Number(row.amount).toString(),
                    currency: row.currency,
                    manualRate: row.manualRate ? Number(row.fxRate).toString() : "",
                    date: formatDate(row.date),
                    category: row.category,
                    paidById: row.paidBy.id,
                    splitType: row.splitType,
                    participantIds: row.shares.map((share) => share.user.id),
                    shareAmounts: Object.fromEntries(
                      row.shares.map((share) => [share.user.id, Number(share.amount).toString()]),
                    ),
                    sharePercents: Object.fromEntries(
                      row.shares.map((share) => [
                        share.user.id,
                        share.percent == null ? "" : Number(share.percent).toString(),
                      ]),
                    ),
                    notes: row.notes ?? "",
                  }}
                  markPaid={
                    row.category !== "SETTLEMENT"
                      ? {
                          paid: row.paid,
                          action: (row.paid ? markExpenseUnpaid : markExpensePaid).bind(null, tripId, row.id),
                        }
                      : undefined
                  }
                  remove={deleteExpense.bind(null, tripId, row.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
