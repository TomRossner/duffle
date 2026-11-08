"use client";

import { createContext, use, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import { messages as en, type Messages } from "@/i18n/messages/en";
import { createTranslator, type Namespace, type Translation } from "@/i18n/translate";

type Loaded = Messages | Translation<Messages>;

// English ships with the app; the other languages load as their own chunk, so each browser only
// downloads the one it uses.
const loaders: Record<Exclude<Locale, "en">, () => Promise<Loaded>> = {
  he: () => import("@/i18n/messages/he").then((module) => module.messages),
  es: () => import("@/i18n/messages/es").then((module) => module.messages),
  fr: () => import("@/i18n/messages/fr").then((module) => module.messages),
  de: () => import("@/i18n/messages/de").then((module) => module.messages),
  ru: () => import("@/i18n/messages/ru").then((module) => module.messages),
};

const loading = new Map<Locale, Promise<Loaded>>();

function load(locale: Locale): Promise<Loaded> | Loaded {
  if (locale === "en") return en;
  let promise = loading.get(locale);
  if (!promise) {
    promise = loaders[locale]();
    loading.set(locale, promise);
  }
  return promise;
}

const I18nContext = createContext<{ locale: Locale; messages: Loaded }>({ locale: "en", messages: en });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const loaded = load(locale);
  const messages = loaded instanceof Promise ? use(loaded) : loaded;
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

/** A translator for one namespace, in the page's language. For Client Components. */
export function useT<N extends Namespace>(namespace: N) {
  const { locale, messages } = use(I18nContext);
  return useMemo(() => createTranslator(locale, messages, namespace), [locale, messages, namespace]);
}

export function useLocale() {
  return use(I18nContext).locale;
}
