import { MemberTag } from "@/components/member-tag";
import { simplifyDebts, type BalanceRow } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

type Person = { id: string; name: string; imageKey?: string | null };

export function BalanceSummary({
  currency,
  people,
  balances,
}: {
  currency: string;
  people: Person[];
  balances: BalanceRow[];
}) {
  const byId = new Map(people.map((person) => [person.id, person]));
  const person = (id: string) => byId.get(id) ?? { id, name: "Traveler", imageKey: null };
  const transfers = simplifyDebts(balances);

  if (balances.length === 0) {
    return <p className="text-sm text-muted-foreground">No paid expenses yet.</p>;
  }
  if (transfers.length === 0) {
    return <p className="text-sm text-muted-foreground">Everyone is settled.</p>;
  }

  return (
    <div className="max-w-full min-w-0 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Who</th>
            <th className="px-3 py-2 font-medium">Owes</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => {
            const from = person(transfer.fromUserId);
            const to = person(transfer.toUserId);
            return (
              <tr key={`${transfer.fromUserId}-${transfer.toUserId}`} className="border-t">
                <td className="px-3 py-2">
                  <MemberTag userId={from.id} name={from.name} imageKey={from.imageKey} />
                </td>
                <td className="px-3 py-2">
                  <MemberTag userId={to.id} name={to.name} imageKey={to.imageKey} />
                </td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {formatMoney(transfer.amount, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
