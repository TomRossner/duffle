import { Backpack, Bath, Briefcase, FileText, Glasses, Handbag, Luggage, Package, Pill, Plug, Shirt } from "lucide-react";
import {
  CATEGORY_LABELS,
  LUGGAGE_LABELS,
  isLuggageKind,
  isPackingCategory,
  type LuggageKind,
  type PackingCategory,
} from "@/lib/packing-list";

const KIND_ICONS: Record<LuggageKind, (props: { className?: string }) => React.ReactNode> = {
  PACK: Backpack,
  BAG: Handbag,
  TROLLEY: Luggage,
  LUGGAGE: Briefcase,
};

const CATEGORY_ICONS: Record<PackingCategory, (props: { className?: string }) => React.ReactNode> = {
  CLOTHES: Shirt,
  TOILETRIES: Bath,
  ELECTRONICS: Plug,
  DOCUMENTS: FileText,
  HEALTH: Pill,
  ACCESSORIES: Glasses,
  OTHER: Package,
};

export const CATEGORY_COLORS: Record<PackingCategory, string> = {
  CLOTHES: "bg-sky-100 text-sky-950",
  TOILETRIES: "bg-teal-100 text-teal-950",
  ELECTRONICS: "bg-indigo-100 text-indigo-950",
  DOCUMENTS: "bg-amber-100 text-amber-950",
  HEALTH: "bg-rose-100 text-rose-950",
  ACCESSORIES: "bg-orange-100 text-orange-950",
  OTHER: "bg-slate-200 text-slate-900",
};

export const KIND_COLORS: Record<LuggageKind, string> = {
  PACK: "bg-emerald-100 text-emerald-950",
  BAG: "bg-amber-100 text-amber-950",
  TROLLEY: "bg-sky-100 text-sky-950",
  LUGGAGE: "bg-violet-100 text-violet-950",
};

export function LuggageKindIcon({ kind, className = "size-4" }: { kind: string; className?: string }) {
  if (!isLuggageKind(kind)) return null;
  const Icon = KIND_ICONS[kind];
  return <Icon className={className} />;
}

export function PackingCategoryIcon({ category, className = "size-4" }: { category: string; className?: string }) {
  if (!isPackingCategory(category)) return null;
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={className} />;
}

export function luggageLabel(kind: string) {
  return isLuggageKind(kind) ? LUGGAGE_LABELS[kind] : kind;
}

export function categoryLabel(category: string) {
  return isPackingCategory(category) ? CATEGORY_LABELS[category] : category;
}
