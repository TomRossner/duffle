import { roundMoney } from "@/lib/utils";

export type ShareInput = {
  userId: string;
  amount?: number;
  percent?: number;
};

export function buildShares(
  splitType: "EQUAL" | "EXACT" | "PERCENT",
  amount: number,
  participantIds: string[],
  inputs: ShareInput[],
) {
  if (participantIds.length === 0) {
    return { error: "Choose at least one person to split with." } as const;
  }

  if (splitType === "EQUAL") {
    const totalCents = Math.round(amount * 100);
    const base = Math.floor(totalCents / participantIds.length);
    let remainder = totalCents - base * participantIds.length;
    const shares = participantIds.map((userId) => {
      const cents = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      return { userId, amount: cents / 100, percent: null as number | null };
    });
    return { shares } as const;
  }

  if (splitType === "EXACT") {
    const shares = participantIds.map((userId) => {
      const input = inputs.find((item) => item.userId === userId);
      return {
        userId,
        amount: roundMoney(input?.amount ?? 0),
        percent: null as number | null,
      };
    });
    const sum = roundMoney(shares.reduce((total, share) => total + share.amount, 0));
    if (sum !== roundMoney(amount)) {
      return { error: "Exact shares must add up to the expense amount." } as const;
    }
    return { shares } as const;
  }

  const shares = participantIds.map((userId) => {
    const input = inputs.find((item) => item.userId === userId);
    const percent = roundMoney(input?.percent ?? 0);
    return {
      userId,
      amount: roundMoney((amount * percent) / 100),
      percent,
    };
  });
  const percentSum = roundMoney(shares.reduce((total, share) => total + (share.percent ?? 0), 0));
  if (percentSum !== 100) {
    return { error: "Percents must add up to 100." } as const;
  }
  const drift = roundMoney(amount - shares.reduce((total, share) => total + share.amount, 0));
  if (shares.length > 0 && drift !== 0) {
    shares[0].amount = roundMoney(shares[0].amount + drift);
  }
  return { shares } as const;
}

export type BalanceRow = {
  userId: string;
  net: number;
};

export type Transfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function netBalances(
  expenses: {
    paidById: string;
    amountInBase: number;
    shares: { userId: string; amount: number }[];
    fxRate: number;
  }[],
) {
  const nets = new Map<string, number>();
  const touch = (userId: string) => {
    if (!nets.has(userId)) nets.set(userId, 0);
  };

  for (const expense of expenses) {
    touch(expense.paidById);
    nets.set(expense.paidById, (nets.get(expense.paidById) ?? 0) + expense.amountInBase);
    for (const share of expense.shares) {
      touch(share.userId);
      const shareBase = roundMoney(share.amount * expense.fxRate);
      nets.set(share.userId, (nets.get(share.userId) ?? 0) - shareBase);
    }
  }

  return [...nets.entries()].map(([userId, net]) => ({
    userId,
    net: roundMoney(net),
  }));
}

export function simplifyDebts(rows: BalanceRow[]): Transfer[] {
  const debtors = rows
    .filter((row) => row.net < -0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => a.net - b.net);
  const creditors = rows
    .filter((row) => row.net > 0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(-debtor.net, creditor.net));
    if (amount > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }
    debtor.net = roundMoney(debtor.net + amount);
    creditor.net = roundMoney(creditor.net - amount);
    if (debtor.net >= -0.009) debtorIndex += 1;
    if (creditor.net <= 0.009) creditorIndex += 1;
  }

  return transfers;
}
