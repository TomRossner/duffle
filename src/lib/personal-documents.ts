import { countryName } from "@/lib/account-details";
import type { Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translate";
import { PERSONAL_DOCUMENT_KINDS } from "@/lib/constants";

export type TripCountryScope = "abroad" | "home" | "unknown";

const suggestedByScope: Record<TripCountryScope, readonly string[]> = {
  abroad: ["PASSPORT", "VISA"],
  home: ["ID", "LICENSE"],
  unknown: ["PASSPORT", "ID", "LICENSE"],
};

export function destinationCountry(address: string | null | undefined) {
  if (!address) return null;
  const last = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();
  if (!last) return null;
  const name = last.replace(/\d+/g, "").trim().toLowerCase();
  return name || null;
}

export function tripCountryScope(homeCountry: string | null | undefined, addresses: (string | null | undefined)[]) {
  if (!homeCountry) return "unknown" as const;
  const home = countryName(homeCountry).toLowerCase();
  const found = addresses.map(destinationCountry).filter((country): country is string => Boolean(country));
  if (found.length === 0) return "unknown" as const;
  return found.some((country) => country !== home) ? ("abroad" as const) : ("home" as const);
}

export function suggestedPersonalKinds(scope: TripCountryScope) {
  return suggestedByScope[scope];
}

export function isPersonalDocumentKind(kind: string) {
  return (PERSONAL_DOCUMENT_KINDS as readonly string[]).includes(kind);
}

export function bringDocumentsCopy(
  scope: TripCountryScope,
  homeCountry: string | null | undefined,
  t: Translator<"documents">,
  locale: Locale,
) {
  const home = homeCountry ? countryName(homeCountry, locale) : null;
  if (scope === "abroad" && home) return t("bring.abroad", { country: home });
  if (scope === "home" && home) return t("bring.home", { country: home });
  return t("bring.generic");
}
