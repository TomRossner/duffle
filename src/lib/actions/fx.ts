"use server";

import { getT } from "@/i18n/server";
import { CURRENCIES } from "@/lib/constants";
import { convertToBase } from "@/lib/fx";
import { requireUser } from "@/lib/trip-access";

/** Live rate for showing money in another currency: 1 `from` = `rate` `to`. */
export async function getExchangeRate(from: string, to: string) {
  await requireUser();
  const known = CURRENCIES as readonly string[];
  if (!known.includes(from) || !known.includes(to)) return { error: (await getT("money"))("errors.unknownCurrency") };
  const result = await convertToBase(1, from, to);
  if ("error" in result) return { error: result.error };
  return { rate: result.rate, date: result.date };
}
