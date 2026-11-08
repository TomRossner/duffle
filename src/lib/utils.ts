import { INTL_LOCALES, type Locale } from "@/i18n/config";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";

export { cn } from "cn";

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function isCurrency(value: string): value is (typeof CURRENCIES)[number] {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function formatMoney(amount: number, currency: string, locale: Locale = "en") {
  const digits = currency === "JPY" ? 0 : 2;
  if (locale !== "en") {
    // Each language places the symbol and separators its own way: "1.234,56 €", "₪ 1,234.56".
    try {
      return new Intl.NumberFormat(INTL_LOCALES[locale], {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(amount);
    } catch {
      // An unknown code falls through to the plain number below.
    }
  }
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
