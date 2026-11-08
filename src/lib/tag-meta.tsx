import {
  Building2,
  CloudRain,
  CloudSnow,
  Dumbbell,
  Footprints,
  Gem,
  Glasses,
  House,
  Plane,
  Shirt,
  Snowflake,
  SportShoe,
  Sun,
  Utensils,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  CLOSET_ACTIVITY_TAGS,
  CLOTHING_SLOTS,
  CONDITION_TAGS,
  slotFamily,
  type ActivityTag,
  type ClothingSlot,
  type ConditionTag,
  type SlotFamily,
} from "@/lib/constants";

export const WEATHER_ICONS: Record<ConditionTag, LucideIcon> = {
  RAIN: CloudRain,
  SUN: Sun,
  COLD: Snowflake,
  SNOW: CloudSnow,
  WIND: Wind,
};

export const WEATHER_COLORS: Record<ConditionTag, string> = {
  RAIN: "bg-blue-100 text-blue-900 [&_svg]:text-blue-600",
  SUN: "bg-amber-100 text-amber-950 [&_svg]:text-amber-600",
  COLD: "bg-cyan-100 text-cyan-950 [&_svg]:text-cyan-600",
  SNOW: "bg-sky-100 text-sky-950 [&_svg]:text-sky-600",
  WIND: "bg-slate-200 text-slate-900 [&_svg]:text-slate-500",
};

export const ACTIVITY_ICONS: Record<ActivityTag, LucideIcon> = {
  HIKE: Footprints,
  SPORT: Dumbbell,
  BEACH: Waves,
  CITY: Building2,
  DINNER: Utensils,
  FLIGHT: Plane,
  EVERYDAY: House,
};

export const ACTIVITY_COLORS: Record<ActivityTag, string> = {
  HIKE: "bg-green-100 text-green-900 [&_svg]:text-green-600",
  SPORT: "bg-lime-100 text-lime-950 [&_svg]:text-lime-600",
  BEACH: "bg-orange-100 text-orange-950 [&_svg]:text-orange-600",
  CITY: "bg-indigo-100 text-indigo-950 [&_svg]:text-indigo-600",
  DINNER: "bg-rose-100 text-rose-950 [&_svg]:text-rose-600",
  FLIGHT: "bg-sky-100 text-sky-950 [&_svg]:text-sky-600",
  EVERYDAY: "bg-yellow-100 text-yellow-950 [&_svg]:text-yellow-600",
};

const FAMILY_COLORS: Record<SlotFamily, string> = {
  TOP: "bg-sky-100 text-sky-950 [&_svg]:text-sky-600",
  BOTTOM: "bg-indigo-100 text-indigo-950 [&_svg]:text-indigo-600",
  OUTER: "bg-violet-100 text-violet-950 [&_svg]:text-violet-600",
  SHOES: "bg-amber-100 text-amber-950 [&_svg]:text-amber-600",
  SOCKS: "bg-stone-200 text-stone-900 [&_svg]:text-stone-500",
  SWIM: "bg-teal-100 text-teal-950 [&_svg]:text-teal-600",
  FORMAL: "bg-fuchsia-100 text-fuchsia-950 [&_svg]:text-fuchsia-600",
  ACCESSORY: "bg-orange-100 text-orange-950 [&_svg]:text-orange-600",
};

export function slotColor(slot: string) {
  const family = slotFamily(slot);
  return family ? FAMILY_COLORS[family] : "bg-muted text-foreground";
}

function StrokeIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function Pants({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M8 3h8" />
      <path d="M8 3 6 21" />
      <path d="M16 3l2 18" />
      <path d="M11 8 9.5 21" />
      <path d="M13 8l1.5 13" />
    </StrokeIcon>
  );
}

function Jacket({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M9 4 4 8v11h4V10" />
      <path d="M15 4l5 4v11h-4V10" />
      <path d="M9 4h6v16H9z" />
      <path d="M12 6v14" />
    </StrokeIcon>
  );
}

function Socks({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M9 3h6v8l2.5 2a3.5 3.5 0 0 1-2.2 6H10a4 4 0 0 1-4-4v-3" />
      <path d="M9 7h6" />
    </StrokeIcon>
  );
}

const FAMILY_ICONS: Record<SlotFamily, (props: { className?: string }) => React.ReactNode> = {
  TOP: Shirt,
  BOTTOM: Pants,
  OUTER: Jacket,
  SHOES: SportShoe,
  SOCKS: Socks,
  SWIM: Waves,
  FORMAL: Gem,
  ACCESSORY: Glasses,
};

export function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function isActivityTag(tag: string): tag is ActivityTag {
  return (CLOSET_ACTIVITY_TAGS as readonly string[]).includes(tag);
}

export function isConditionTag(tag: string): tag is ConditionTag {
  return (CONDITION_TAGS as readonly string[]).includes(tag);
}

export function isClothingSlot(slot: string): slot is ClothingSlot {
  return (CLOTHING_SLOTS as readonly string[]).includes(slot);
}

export function ClothingSlotIcon({ slot, className = "size-4" }: { slot: string; className?: string }) {
  const family = slotFamily(slot);
  if (!family) return null;
  const Icon = FAMILY_ICONS[family];
  return <Icon className={className} />;
}

export function ActivityTagLabel({ tag, iconClassName = "size-4" }: { tag: ActivityTag; iconClassName?: string }) {
  const Icon = ACTIVITY_ICONS[tag];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={iconClassName} aria-hidden />
      {titleCase(tag)}
    </span>
  );
}

export function WeatherTagLabel({ tag, iconClassName = "size-4" }: { tag: ConditionTag; iconClassName?: string }) {
  const Icon = WEATHER_ICONS[tag];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={iconClassName} aria-hidden />
      {titleCase(tag)}
    </span>
  );
}
