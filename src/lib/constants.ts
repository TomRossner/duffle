export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "ILS",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "THB",
  "MXN",
  "INR",
  "SGD",
  "ISK",
] as const;

export const CURRENCY_SYMBOLS: Record<(typeof CURRENCIES)[number], string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ILS: "₪",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "Fr",
  THB: "฿",
  MXN: "MX$",
  INR: "₹",
  SGD: "S$",
  ISK: "kr",
};

export const CURRENCY_NAMES: Record<(typeof CURRENCIES)[number], string> = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  ILS: "Israeli shekel",
  JPY: "Japanese yen",
  CAD: "Canadian dollar",
  AUD: "Australian dollar",
  CHF: "Swiss franc",
  THB: "Thai baht",
  MXN: "Mexican peso",
  INR: "Indian rupee",
  SGD: "Singapore dollar",
  ISK: "Icelandic króna",
};

export const ACTIVITY_TAGS = ["HIKE", "SPORT", "BEACH", "CITY", "DINNER", "FLIGHT"] as const;

export const CLOSET_ACTIVITY_TAGS = [...ACTIVITY_TAGS, "EVERYDAY"] as const;

export const CONDITION_TAGS = ["RAIN", "SUN", "COLD", "SNOW", "WIND"] as const;

export const CLOTHING_SLOTS = [
  "TOP",
  "TSHIRT",
  "LONG_SLEEVE",
  "BASE_LAYER",
  "MID_LAYER",
  "SWEATER",
  "PULLOVER",
  "SWEATSHIRT",
  "BOTTOM",
  "SHORTS",
  "RUNNING_SHORTS",
  "HIKING_PANTS",
  "JOGGING_PANTS",
  "JEANS",
  "SHORT_JEANS",
  "OUTER",
  "FLEECE",
  "SOFTSHELL",
  "CARDIGAN",
  "RAIN_JACKET",
  "DOWN_JACKET",
  "SOCKS",
  "SOCKS_LONG",
  "SOCKS_SHORT",
  "SOCKS_MEDIUM",
  "SOCKS_THICK",
  "SOCKS_THIN",
  "SHOES",
  "SWIM",
  "FORMAL",
  "ACCESSORY",
] as const;

export type ClothingSlot = (typeof CLOTHING_SLOTS)[number];

export const CLOTHING_SLOT_LABELS: Record<ClothingSlot, string> = {
  TOP: "Top",
  TSHIRT: "T-shirt",
  LONG_SLEEVE: "Long sleeve",
  BASE_LAYER: "Base layer",
  MID_LAYER: "Mid-layer",
  SWEATER: "Sweater",
  PULLOVER: "Pullover",
  SWEATSHIRT: "Sweatshirt",
  BOTTOM: "Bottom",
  SHORTS: "Shorts",
  RUNNING_SHORTS: "Running shorts",
  HIKING_PANTS: "Hiking pants",
  JOGGING_PANTS: "Jogging pants",
  JEANS: "Jeans",
  SHORT_JEANS: "Short jeans",
  OUTER: "Outer",
  FLEECE: "Fleece",
  SOFTSHELL: "Soft shell",
  CARDIGAN: "Cardigan",
  RAIN_JACKET: "Rain jacket",
  DOWN_JACKET: "Down jacket",
  SOCKS: "Socks",
  SOCKS_LONG: "Long socks",
  SOCKS_SHORT: "Short socks",
  SOCKS_MEDIUM: "Medium socks",
  SOCKS_THICK: "Thick socks",
  SOCKS_THIN: "Thin socks",
  SHOES: "Shoes",
  SWIM: "Swim",
  FORMAL: "Formal",
  ACCESSORY: "Accessory",
};

export const CLOTHING_SLOT_GROUPS: { label: string; slots: readonly ClothingSlot[] }[] = [
  {
    label: "Tops",
    slots: [
      "TOP",
      "TSHIRT",
      "LONG_SLEEVE",
      "BASE_LAYER",
      "MID_LAYER",
      "SWEATER",
      "PULLOVER",
      "SWEATSHIRT",
      "FLEECE",
      "SOFTSHELL",
      "RAIN_JACKET",
      "DOWN_JACKET",
    ],
  },
  { label: "Pants", slots: ["BOTTOM", "SHORTS", "RUNNING_SHORTS", "HIKING_PANTS", "JOGGING_PANTS", "JEANS", "SHORT_JEANS", "CARDIGAN"] },
  { label: "Socks", slots: ["SOCKS", "SOCKS_LONG", "SOCKS_SHORT", "SOCKS_MEDIUM", "SOCKS_THICK", "SOCKS_THIN"] },
  { label: "Other", slots: ["OUTER", "SHOES", "SWIM", "FORMAL", "ACCESSORY"] },
];

const SLOT_FAMILIES = {
  TOP: "TOP",
  TSHIRT: "TOP",
  LONG_SLEEVE: "TOP",
  BASE_LAYER: "TOP",
  MID_LAYER: "TOP",
  SWEATER: "TOP",
  PULLOVER: "TOP",
  SWEATSHIRT: "TOP",
  BOTTOM: "BOTTOM",
  SHORTS: "BOTTOM",
  RUNNING_SHORTS: "BOTTOM",
  HIKING_PANTS: "BOTTOM",
  JOGGING_PANTS: "BOTTOM",
  JEANS: "BOTTOM",
  SHORT_JEANS: "BOTTOM",
  OUTER: "OUTER",
  FLEECE: "OUTER",
  SOFTSHELL: "OUTER",
  CARDIGAN: "OUTER",
  RAIN_JACKET: "OUTER",
  DOWN_JACKET: "OUTER",
  SOCKS: "SOCKS",
  SOCKS_LONG: "SOCKS",
  SOCKS_SHORT: "SOCKS",
  SOCKS_MEDIUM: "SOCKS",
  SOCKS_THICK: "SOCKS",
  SOCKS_THIN: "SOCKS",
  SHOES: "SHOES",
  SWIM: "SWIM",
  FORMAL: "FORMAL",
  ACCESSORY: "ACCESSORY",
} as const satisfies Record<ClothingSlot, string>;

export type SlotFamily = (typeof SLOT_FAMILIES)[ClothingSlot];

export function slotFamily(slot: string): SlotFamily | null {
  if ((CLOTHING_SLOTS as readonly string[]).includes(slot)) return SLOT_FAMILIES[slot as ClothingSlot];
  return null;
}

export function slotLabel(slot: string) {
  if ((CLOTHING_SLOTS as readonly string[]).includes(slot)) return CLOTHING_SLOT_LABELS[slot as ClothingSlot];
  return slot.charAt(0) + slot.slice(1).toLowerCase();
}

export const DOCUMENT_KINDS = [
  "PASSPORT",
  "TICKET",
  "INSURANCE",
  "BOOKING",
  "OTHER",
] as const;

export const PERSONAL_DOCUMENT_KINDS = ["PASSPORT", "ID", "LICENSE", "VISA", "OTHER"] as const;

export const PERSONAL_DOCUMENT_LABELS: Record<(typeof PERSONAL_DOCUMENT_KINDS)[number], string> = {
  PASSPORT: "Passport",
  ID: "National ID",
  LICENSE: "Driving license",
  VISA: "Visa",
  OTHER: "Other",
};

export function personalDocumentLabel(kind: string) {
  if ((PERSONAL_DOCUMENT_KINDS as readonly string[]).includes(kind)) {
    return PERSONAL_DOCUMENT_LABELS[kind as (typeof PERSONAL_DOCUMENT_KINDS)[number]];
  }
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}

export const INSURANCE_TYPES = ["TRAVEL", "HEALTH", "CANCEL", "OTHER"] as const;

export const SCHEDULE_KINDS = ["DINNER", "TRANSFER", "MEETUP", "OTHER"] as const;

export const PLAN_KINDS = [
  { id: "FLIGHT", label: "Flight" },
  { id: "TRANSFER", label: "Drive / Transport" },
  { id: "STAY", label: "Stay" },
  { id: "DINNER", label: "Dining out" },
  { id: "MEETUP", label: "Meetup" },
  { id: "OTHER", label: "Other" },
] as const;

export const PLAN_COLORS: Record<(typeof PLAN_KINDS)[number]["id"], string> = {
  FLIGHT: "bg-sky-100 text-sky-950",
  TRANSFER: "bg-amber-100 text-amber-950",
  STAY: "bg-violet-100 text-violet-950",
  DINNER: "bg-rose-100 text-rose-950",
  MEETUP: "bg-emerald-100 text-emerald-950",
  OTHER: "bg-slate-200 text-slate-900",
};

export function planLabel(kind: string) {
  return PLAN_KINDS.find((entry) => entry.id === kind)?.label ?? kind;
}

export { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export type ActivityTag = (typeof CLOSET_ACTIVITY_TAGS)[number];
export type ConditionTag = (typeof CONDITION_TAGS)[number];
