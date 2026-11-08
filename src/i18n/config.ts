export const LOCALES = ["en", "he", "es", "fr", "de", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Holds the chosen language. Read on the server for every render, so it lives in a cookie, not the URL. */
export const LOCALE_COOKIE = "duffle-locale";

/** Each language's name in itself, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  he: "עברית",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
};

/** The English name, shown beside the native one so a picker in an unfamiliar language is still readable. */
export const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  en: "English",
  he: "Hebrew",
  es: "Spanish",
  fr: "French",
  de: "German",
  ru: "Russian",
};

/**
 * The locale passed to Intl for dates and numbers. English uses British conventions, matching the app's
 * day-month dates ("14 Sep 2026").
 */
export const INTL_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  he: "he-IL",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ru: "ru-RU",
};

const RTL_LOCALES: readonly Locale[] = ["he"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** The best supported language for an Accept-Language header ("he-IL,he;q=0.9,en;q=0.8"). */
export function matchLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    // "iw" is the old code for Hebrew, still sent by some browsers.
    const base = tag.split("-")[0] === "iw" ? "he" : tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
