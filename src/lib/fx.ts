import { roundMoney } from "@/lib/utils";

type RateResult =
  | { rate: number; date: string; amountInBase: number }
  | { error: string };

export async function convertToBase(
  amount: number,
  from: string,
  to: string,
  manualRate?: number | null,
): Promise<RateResult> {
  if (from === to) {
    return {
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      amountInBase: roundMoney(amount),
    };
  }

  if (manualRate != null && manualRate > 0) {
    return {
      rate: manualRate,
      date: new Date().toISOString().slice(0, 10),
      amountInBase: roundMoney(amount * manualRate),
    };
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return {
        error: `No exchange rate for ${from} to ${to}. Enter a manual rate.`,
      };
    }
    const data = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const rate = data.rates?.[to];
    if (!rate || !data.date) {
      return {
        error: `No exchange rate for ${from} to ${to}. Enter a manual rate.`,
      };
    }
    return {
      rate,
      date: data.date,
      amountInBase: roundMoney(amount * rate),
    };
  } catch {
    return {
      error: "Currency service is unavailable. Enter a manual rate.",
    };
  }
}
