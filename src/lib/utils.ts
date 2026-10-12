import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";

export { cn } from "cn";

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function isCurrency(value: string): value is (typeof CURRENCIES)[number] {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function formatMoney(amount: number, currency: string) {
  const digits = currency === "JPY" ? 0 : 2;
  const number = new Intl.NumberFormat("en", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  if (isCurrency(currency)) return `${CURRENCY_SYMBOLS[currency]}${number}`;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${number} ${currency}`;
  }
}
