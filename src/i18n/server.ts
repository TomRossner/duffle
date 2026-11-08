import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, matchLocale, type Locale } from "@/i18n/config";
import { messages as de } from "@/i18n/messages/de";
import { messages as en } from "@/i18n/messages/en";
import { messages as es } from "@/i18n/messages/es";
import { messages as fr } from "@/i18n/messages/fr";
import { messages as he } from "@/i18n/messages/he";
import { messages as ru } from "@/i18n/messages/ru";
import { createTranslator, type Namespace } from "@/i18n/translate";

const ALL = { en, he, es, fr, de, ru };

/** The request's language: the saved choice, or else the browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return matchLocale((await headers()).get("accept-language"));
});

/** A translator for one namespace, in the request's language. For Server Components and Server Actions. */
export async function getT<N extends Namespace>(namespace: N) {
  return createTranslator(await getLocale(), ALL[await getLocale()], namespace);
}

/** A translator for a given language, for things sent to someone else (emails, notifications). */
export function translatorFor<N extends Namespace>(locale: string | null | undefined, namespace: N) {
  const chosen = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return createTranslator(chosen, ALL[chosen], namespace);
}
