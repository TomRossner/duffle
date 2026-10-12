"use client";

import {
  BedDouble,
  Bike,
  Car,
  CarTaxiFront,
  Circle,
  CircleParking,
  Clapperboard,
  Droplets,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Handshake,
  HeartPulse,
  Home,
  Music,
  PawPrint,
  Phone,
  Plane,
  Shield,
  Shirt,
  ShoppingCart,
  Sofa,
  SprayCan,
  Ticket,
  TrainFront,
  Utensils,
  Wifi,
  Wine,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_GROUPS,
  expenseGroupFor,
} from "@/lib/expense-categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ACTIVITY: Ticket,
  GAMES: Gamepad2,
  MOVIES: Clapperboard,
  MUSIC: Music,
  SPORTS: Dumbbell,
  FOOD: Utensils,
  GROCERIES: ShoppingCart,
  LIQUOR: Wine,
  RENT: Home,
  HOUSEHOLD: SprayCan,
  FURNITURE: Sofa,
  MAINTENANCE: Wrench,
  PETS: PawPrint,
  INSURANCE: Shield,
  MEDICAL: HeartPulse,
  CLOTHING: Shirt,
  EDUCATION: GraduationCap,
  GIFTS: Gift,
  FLIGHT: Plane,
  STAY: BedDouble,
  TRANSPORT: Car,
  GAS: Fuel,
  PARKING: CircleParking,
  TAXI: CarTaxiFront,
  TRAIN: TrainFront,
  BICYCLE: Bike,
  ELECTRICITY: Zap,
  WATER: Droplets,
  INTERNET: Wifi,
  PHONE: Phone,
  OTHER: Circle,
  SETTLEMENT: Handshake,
};

export function ExpenseCategoryTag({ category, className }: { category: string; className?: string }) {
  const group = expenseGroupFor(category);
  const Icon = ICONS[category] ?? Circle;
  const label =
    EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? category;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        group?.className ?? "bg-slate-200 text-slate-900",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function ExpenseCategoryPicker({ defaultValue = "OTHER" }: { defaultValue?: string }) {
  const initialGroup = expenseGroupFor(defaultValue)?.id ?? "GENERAL";
  const [groupId, setGroupId] = useState(initialGroup);
  const [category, setCategory] = useState(defaultValue);
  const group = EXPENSE_GROUPS.find((item) => item.id === groupId) ?? EXPENSE_GROUPS[0];

  function chooseGroup(id: string) {
    setGroupId(id);
    const next = EXPENSE_GROUPS.find((item) => item.id === id);
    if (next && !(next.items as readonly string[]).includes(category)) {
      setCategory(next.items[0]);
    }
  }

  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-sm leading-none font-medium">Category</span>
      <input type="hidden" name="category" value={category} />
      <div className="flex flex-wrap gap-1.5">
        {EXPENSE_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium",
              item.id === groupId ? item.className : "bg-muted text-muted-foreground",
            )}
            onClick={() => chooseGroup(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === category}
            className="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-0 leading-none outline-none"
            onClick={() => setCategory(item)}
          >
            <ExpenseCategoryTag
              category={item}
              className={item === category ? "ring-2 ring-inset ring-foreground" : undefined}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
