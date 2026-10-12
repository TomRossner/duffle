import { slotFamily } from "@/lib/constants";

export const LUGGAGE_KINDS = ["PACK", "BAG", "TROLLEY", "LUGGAGE"] as const;

export const PACKING_CATEGORIES = [
  "CLOTHES",
  "TOILETRIES",
  "ELECTRONICS",
  "DOCUMENTS",
  "HEALTH",
  "ACCESSORIES",
  "OTHER",
] as const;

export type LuggageKind = (typeof LUGGAGE_KINDS)[number];
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export const LUGGAGE_LABELS: Record<LuggageKind, string> = {
  PACK: "Pack",
  BAG: "Bag",
  TROLLEY: "Trolley",
  LUGGAGE: "Luggage",
};

export const CATEGORY_LABELS: Record<PackingCategory, string> = {
  CLOTHES: "Clothes",
  TOILETRIES: "Toiletries",
  ELECTRONICS: "Electronics",
  DOCUMENTS: "Documents",
  HEALTH: "Health",
  ACCESSORIES: "Accessories",
  OTHER: "Other",
};

export function isLuggageKind(value: string): value is LuggageKind {
  return (LUGGAGE_KINDS as readonly string[]).includes(value);
}

export function isPackingCategory(value: string): value is PackingCategory {
  return (PACKING_CATEGORIES as readonly string[]).includes(value);
}

export function categoryForSlot(slot: string): PackingCategory {
  return slotFamily(slot) === "ACCESSORY" ? "ACCESSORIES" : "CLOTHES";
}

export function readQuantity(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return 1;
  const quantity = Number(raw);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
  return quantity;
}
