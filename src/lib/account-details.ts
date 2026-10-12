import { getCountryCallingCode, isSupportedCountry } from "libphonenumber-js/min";
import { asDateOnly, parseDate } from "@/lib/dates";

export const GENDERS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "UNSPECIFIED", label: "Prefer not to say" },
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

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string) {
  return countryNames.of(code) ?? code;
}

const codeByName = new Map(COUNTRY_CODES.map((code) => [countryName(code).toLowerCase(), code]));

export function countryCodeForName(name: string) {
  return codeByName.get(name.trim().toLowerCase()) ?? null;
}

export function countryOptions() {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function genderLabel(value: string | null | undefined) {
  return GENDERS.find((gender) => gender.value === value)?.label ?? null;
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

export function readAccountDetails(formData: FormData): { error: string } | { data: AccountDetails } {
  const gender = String(formData.get("gender") ?? "");
  if (!GENDERS.some((option) => option.value === gender)) return { error: "Choose a gender." };

  const birthDate = parseDate(String(formData.get("birthDate") ?? ""));
  const earliest = parseDate("1900-01-01");
  if (!birthDate || !earliest || birthDate < earliest || birthDate > asDateOnly(new Date())) {
    return { error: "Enter a valid birth date." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15 || !/^\+?[0-9\s().-]+$/.test(phone)) {
    return { error: "Enter a valid phone number." };
  }

  const country = String(formData.get("country") ?? "");
  if (!countrySet.has(country)) return { error: "Choose a country." };

  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 3 || address.length > 120) return { error: "Enter a street address." };

  const city = String(formData.get("city") ?? "").trim();
  if (city.length < 2 || city.length > 80) return { error: "Enter a city." };

  const postalCode = String(formData.get("postalCode") ?? "").trim();
  if (postalCode.length < 2 || postalCode.length > 12) return { error: "Enter a postal code." };

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
