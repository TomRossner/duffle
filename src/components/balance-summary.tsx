import { ArrowRight, PartyPopper } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Money } from "@/components/money-view";
import { getT } from "@/i18n/server";
import { simplifyDebts, type BalanceRow } from "@/lib/money";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; imageKey?: string | null };

/** Who pays whom to settle the trip, plus where each traveler stands overall. */
export async function BalanceSummary({
  currency,
  people,
  balances,
  viewerId,
}: {
  currency: string;
  people: Person[];
  balances: BalanceRow[];
  viewerId: string;
}) {
  const t = await getT("money");
  const tCommon = await getT("common");
  const byId = new Map(people.map((person) => [person.id, person]));
  const person = (id: string) => byId.get(id) ?? { id, name: t("balance.traveler"), imageKey: null };
  const label = (id: string) => (id === viewerId ? tCommon("you") : person(id).name);
  const transfers = simplifyDebts(balances);

  if (balances.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("balance.empty")}</p>;
  }

  const standings = [...balances].sort((a, b) => b.net - a.net);

  return (
    <div className="grid gap-5">
      {transfers.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <PartyPopper className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {t("balance.settledUp")}
        </p>
      ) : (
        <ul className="grid gap-2">
          {transfers.map((transfer) => {
            const from = person(transfer.fromUserId);
            const to = person(transfer.toUserId);
            const involvesViewer = from.id === viewerId || to.id === viewerId;
            return (
              <li
                key={`${transfer.fromUserId}-${transfer.toUserId}`}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10",
                  involvesViewer && "bg-muted/60",
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Avatar name={from.name} userId={from.id} imageKey={from.imageKey} />
                  <span className="font-medium">{label(from.id)}</span>
                  <span className="text-muted-foreground">{from.id === viewerId ? t("balance.youPay") : t("balance.pays")}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                  <Avatar name={to.name} userId={to.id} imageKey={to.imageKey} />
                  <span className="font-medium">{to.id === viewerId ? t("balance.you") : to.name}</span>
                </span>
                <Money amount={transfer.amount} currency={currency} className="ms-auto text-base font-semibold" />
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("balance.standings")}</p>
        <ul className="flex flex-wrap gap-2">
          {standings.map((row) => {
            const who = person(row.userId);
            const owed = row.net > 0.009;
            const owes = row.net < -0.009;
            return (
              <li
                key={row.userId}
                className="inline-flex items-center gap-2 rounded-full py-1 pe-3 ps-1 text-sm ring-1 ring-foreground/10"
              >
                <Avatar name={who.name} userId={who.id} imageKey={who.imageKey} />
                <span>{label(row.userId)}</span>
                {owed || owes ? (
                  <span
                    className={cn(
                      "font-medium",
                      owed ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {t.rich(owed ? "balance.getsBack" : "balance.owes", {
                      amount: <Money amount={Math.abs(row.net)} currency={currency} />,
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("balance.settled")}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
