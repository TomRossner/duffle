import { Check, Wallet } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BalanceSummary } from "@/components/balance-summary";
import { BudgetSheets } from "@/components/budget-sheets";
import { ExpenseCategoryTag } from "@/components/expense-category";
import { ExpenseRowMenu } from "@/components/expense-editor";
import { ExpenseFormToggle, SettlementFormToggle } from "@/components/money-panel";
import { SplitTypeIcon } from "@/components/split-type";
import { ConvertCurrencyButton, DisplayCurrencyProvider, Money, OriginalAmount } from "@/components/money-view";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createExpense, deleteExpense, markExpensePaid, markExpenseUnpaid, updateExpense } from "@/lib/actions/expenses";
import { formatDate, formatDateLong } from "@/lib/dates";
import { netBalances } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { cn, roundMoney } from "@/lib/utils";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export default async function MoneyPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip, user } = await requireTrip(tripId);
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
  const spending = [...actual, ...paidPlanned];
  const ledger = [...spending, ...settlements].sort(
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
  const groupTotal = roundMoney(spending.reduce((total, expense) => total + Number(expense.amountInBase), 0));
  const yourShare = roundMoney(
    spending.reduce(
      (total, expense) =>
        total +
        expense.shares
          .filter((share) => share.userId === user.id)
          .reduce((sum, share) => sum + Number(share.amount) * Number(expense.fxRate), 0),
      0,
    ),
  );
  const yourNet = balances.find((row) => row.userId === user.id)?.net ?? 0;

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
      <TabsContent value="actual" className="pt-4">
        <DisplayCurrencyProvider tripId={tripId} base={trip.baseCurrency}>
          <div className="grid gap-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Group spending"
                hint={`${spending.length} ${spending.length === 1 ? "expense" : "expenses"} so far`}
              >
                <Money amount={groupTotal} />
              </Stat>
              <Stat label="Your share" hint="Your part of everything spent">
                <Money amount={yourShare} />
              </Stat>
              <Stat
                label={yourNet > 0.009 ? "You get back" : yourNet < -0.009 ? "You owe" : "Your balance"}
                hint={
                  yourNet > 0.009
                    ? "You paid more than your share"
                    : yourNet < -0.009
                      ? "Others covered part of your share"
                      : "You're all square"
                }
                tone={yourNet > 0.009 ? "good" : yourNet < -0.009 ? "bad" : undefined}
              >
                {Math.abs(yourNet) > 0.009 ? <Money amount={Math.abs(yourNet)} /> : "Settled"}
              </Stat>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-start">
              <ExpenseFormToggle
                label="Add a shared expense"
                description={`Amounts in other currencies are converted into ${trip.baseCurrency}.`}
                action={createExpense.bind(null, tripId, "ACTUAL")}
                members={people}
                currency={trip.baseCurrency}
                submitLabel="Add expense"
              />
              <SettlementFormToggle tripId={tripId} members={people} currency={trip.baseCurrency} />
              <div className="sm:ml-auto">
                <ConvertCurrencyButton />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Settle up</CardTitle>
                <CardDescription>
                  The fewest payments that make everyone even. When one happens, use “Record a payment”.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BalanceSummary currency={trip.baseCurrency} people={people} balances={balances} viewerId={user.id} />
              </CardContent>
            </Card>

            <section className="grid gap-3">
              <h2 className="font-heading text-base font-medium">Expenses &amp; payments</h2>
              <ExpenseList
                tripId={tripId}
                currency={trip.baseCurrency}
                members={people}
                viewerId={user.id}
                rows={ledger}
              />
            </section>
          </div>
        </DisplayCurrencyProvider>
      </TabsContent>
    </Tabs>
  );
}

function Stat({
  label,
  hint,
  tone,
  children,
}: {
  label: string;
  hint: string;
  tone?: "good" | "bad";
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-heading text-2xl font-semibold",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "bad" && "text-rose-700 dark:text-rose-400",
        )}
      >
        {children}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

type LedgerRow = {
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
  createdAt: Date;
  notes: string | null;
  splitType: string;
  paidBy: { id: string; name: string; imageKey: string | null };
  manualRate: boolean;
  shares: {
    user: { id: string; name: string; imageKey: string | null };
    amount: { toString(): string };
    percent: { toString(): string } | null;
  }[];
};

function ExpenseList({
  tripId,
  currency,
  members,
  viewerId,
  rows,
}: {
  tripId: string;
  currency: string;
  members: { id: string; name: string; imageKey?: string | null }[];
  viewerId: string;
  rows: LedgerRow[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState icon={Wallet} title="No expenses yet">
        Add what the group spends as you go, like dinner, taxis or tickets. Choose who paid and how to split it, and
        Duffle works out who owes whom.
      </EmptyState>
    );
  }

  // Newest day first, newest entry first within a day.
  const days = new Map<string, LedgerRow[]>();
  for (const row of [...rows].reverse()) {
    const key = formatDate(row.date);
    days.set(key, [...(days.get(key) ?? []), row]);
  }

  return (
    <div className="grid gap-5">
      {[...days.values()].map((dayRows) => {
        const dayTotal = roundMoney(
          dayRows
            .filter((row) => row.category !== "SETTLEMENT")
            .reduce((total, row) => total + Number(row.amountInBase), 0),
        );
        return (
          <div key={formatDate(dayRows[0].date)} className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3 px-1 text-xs font-medium text-muted-foreground">
              <span>{formatDateLong(dayRows[0].date)}</span>
              {dayTotal > 0 ? (
                <span>
                  Spent <Money amount={dayTotal} />
                </span>
              ) : null}
            </div>
            <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
              {dayRows.map((row) => (
                <ExpenseItem
                  key={row.id}
                  tripId={tripId}
                  currency={currency}
                  members={members}
                  viewerId={viewerId}
                  row={row}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ExpenseItem({
  tripId,
  currency,
  members,
  viewerId,
  row,
}: {
  tripId: string;
  currency: string;
  members: { id: string; name: string; imageKey?: string | null }[];
  viewerId: string;
  row: LedgerRow;
}) {
  const settlement = row.category === "SETTLEMENT";
  const name = (person: { id: string; name: string }) => (person.id === viewerId ? "You" : firstName(person.name));
  const fxRate = Number(row.fxRate);
  const recipient = settlement ? row.shares[0]?.user : null;

  return (
    <li className="flex items-start gap-3 px-3 py-3">
      <div className="grid min-w-0 flex-1 gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {settlement && recipient
              ? `${name(row.paidBy)} paid ${recipient.id === viewerId ? "you" : firstName(recipient.name)}`
              : row.title}
          </span>
          <ExpenseCategoryTag category={row.category} className="whitespace-nowrap" />
          {row.phase === "PLANNED" ? <Badge variant="outline">From the plan</Badge> : null}
          {row.phase === "ACTUAL" && row.paid && !settlement ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Check aria-hidden />
              Paid
            </Badge>
          ) : null}
          {row.manualRate ? <span className="text-xs text-muted-foreground">Manual rate</span> : null}
        </div>
        {settlement ? null : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={row.paidBy.name} userId={row.paidBy.id} imageKey={row.paidBy.imageKey} />
              <span>
                <span className="font-medium text-foreground">{name(row.paidBy)}</span> paid
              </span>
            </span>
            <span className="inline-flex flex-wrap items-center gap-x-1">
              <SplitTypeIcon splitType={row.splitType} />
              Split{" "}
              {row.shares.map((share, index) => (
                <span key={share.user.id}>
                  {index > 0 ? " · " : ""}
                  {name(share.user)} <Money amount={roundMoney(Number(share.amount) * fxRate)} />
                </span>
              ))}
            </span>
          </div>
        )}
        {row.notes ? <p className="text-xs text-muted-foreground">{row.notes}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5">
        <Money amount={Number(row.amountInBase)} className="font-semibold" />
        <OriginalAmount amount={Number(row.amount)} currency={row.currency} />
      </div>
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
          shareAmounts: Object.fromEntries(row.shares.map((share) => [share.user.id, Number(share.amount).toString()])),
          sharePercents: Object.fromEntries(
            row.shares.map((share) => [share.user.id, share.percent == null ? "" : Number(share.percent).toString()]),
          ),
          notes: row.notes ?? "",
        }}
        markPaid={
          !settlement
            ? {
                paid: row.paid,
                action: (row.paid ? markExpenseUnpaid : markExpensePaid).bind(null, tripId, row.id),
              }
            : undefined
        }
        remove={deleteExpense.bind(null, tripId, row.id)}
      />
    </li>
  );
}
