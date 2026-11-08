import { getCountryCallingCode, isSupportedCountry } from "libphonenumber-js/min";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translate";
import { CURRENCY_NAMES } from "@/lib/constants";
import { asDateOnly, parseDate } from "@/lib/dates";

/** Labels are in the profile messages, under `genders`. */
export const GENDERS = [
  { value: "FEMALE" },
  { value: "MALE" },
  { value: "NON_BINARY" },
  { value: "UNSPECIFIED" },
] as const;

export type GenderValue = (typeof GENDERS)[number]["value"];

export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
] as const;

const countryNames = new Map<Locale, Intl.DisplayNames>();

/** A country's name in a language ("DE" → "Germany", "Allemagne", "גרמניה"). */
export function countryName(code: string, locale: Locale = "en") {
  let names = countryNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([INTL_LOCALES[locale]], { type: "region" });
    countryNames.set(locale, names);
  }
  return names.of(code) ?? code;
}

/** The names of trip countries as one list, for labels: "Germany, Austria". */
export function countryList(codes: string[], locale: Locale = "en") {
  return codes.map((code) => countryName(code, locale)).join(", ");
}

// English names, for matching what a document reader or a person typed.
const codeByName = new Map(COUNTRY_CODES.map((code) => [countryName(code).toLowerCase(), code]));

export function countryCodeForName(name: string) {
  return codeByName.get(name.trim().toLowerCase()) ?? null;
}

/** Every country, named and sorted for a language. `english` is kept so searches in English still match. */
export function countryOptions(locale: Locale = "en") {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale), english: countryName(code) })).sort(
    (a, b) => a.name.localeCompare(b.name, INTL_LOCALES[locale]),
  );
}

export function callingCode(country: string | null | undefined) {
  if (!country || !isSupportedCountry(country)) return "";
  return getCountryCallingCode(country);
}

export function nationalNumber(phone: string | null | undefined, country: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const code = callingCode(country);
  let national = digits;
  if (code && national.startsWith(code) && national.length > code.length) national = national.slice(code.length);
  if (code && national.startsWith("0")) national = national.replace(/^0+/, "");
  return national;
}

export function composePhone(national: string, country: string | null | undefined) {
  const digits = national.replace(/\D/g, "");
  const code = callingCode(country);
  if (!code) return digits;
  const local = digits.replace(/^0+/, "");
  return local ? `+${code}${local}` : "";
}

export function formatPhone(phone: string | null | undefined, country: string | null | undefined) {
  const national = nationalNumber(phone, country);
  const code = callingCode(country);
  if (!national) return null;
  if (!code) return phone?.trim() || national;
  return `+${code} ${national}`;
}

export type AccountDetails = {
  gender: GenderValue;
  birthDate: Date;
  phone: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
};

const countrySet = new Set<string>(COUNTRY_CODES);

export function readTripCountries(formData: FormData) {
  const codes = formData.getAll("countries").map((value) => String(value).trim().toUpperCase());
  return [...new Set(codes)].filter((code) => countrySet.has(code));
}

export function readAccountDetails(
  formData: FormData,
  t: Translator<"profile">,
): { error: string } | { data: AccountDetails } {
  const gender = String(formData.get("gender") ?? "");
  if (!GENDERS.some((option) => option.value === gender)) return { error: t("errors.gender") };

  const birthDate = parseDate(String(formData.get("birthDate") ?? ""));
  const earliest = parseDate("1900-01-01");
  if (!birthDate || !earliest || birthDate < earliest || birthDate > asDateOnly(new Date())) {
    return { error: t("errors.birthDate") };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15 || !/^\+?[0-9\s().-]+$/.test(phone)) {
    return { error: t("errors.phone") };
  }

  const country = String(formData.get("country") ?? "");
  if (!countrySet.has(country)) return { error: t("errors.country") };

  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 3 || address.length > 120) return { error: t("errors.address") };

  const city = String(formData.get("city") ?? "").trim();
  if (city.length < 2 || city.length > 80) return { error: t("errors.city") };

  const postalCode = String(formData.get("postalCode") ?? "").trim();
  if (postalCode.length < 2 || postalCode.length > 12) return { error: t("errors.postalCode") };

  return {
    data: {
      gender: gender as GenderValue,
      birthDate,
      phone,
      country,
      address,
      city,
      postalCode,
    },
  };
}

const currencyNames = new Map<Locale, Intl.DisplayNames>();

/** A currency's name in a language ("EUR" → "Euro", "יורו"). */
export function currencyName(code: string, locale: Locale = "en") {
  if (locale === "en" && code in CURRENCY_NAMES) return CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES];
  let names = currencyNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([INTL_LOCALES[locale]], { type: "currency" });
    currencyNames.set(locale, names);
  }
  return names.of(code) ?? code;
}
