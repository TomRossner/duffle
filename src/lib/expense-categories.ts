export const EXPENSE_GROUPS = [
  {
    id: "ENTERTAINMENT",
    label: "Entertainment",
    className: "bg-emerald-100 text-emerald-950 [&_svg]:text-emerald-600",
    items: ["ACTIVITY", "GAMES", "MOVIES", "MUSIC", "SPORTS"],
  },
  {
    id: "FOOD",
    label: "Food and drink",
    className: "bg-orange-100 text-orange-950 [&_svg]:text-orange-600",
    items: ["FOOD", "GROCERIES", "LIQUOR"],
  },
  {
    id: "HOME",
    label: "Home",
    className: "bg-violet-100 text-violet-950 [&_svg]:text-violet-600",
    items: ["RENT", "HOUSEHOLD", "FURNITURE", "MAINTENANCE", "PETS"],
  },
  {
    id: "LIFE",
    label: "Life",
    className: "bg-rose-100 text-rose-950 [&_svg]:text-rose-600",
    items: ["INSURANCE", "MEDICAL", "CLOTHING", "EDUCATION", "GIFTS"],
  },
  {
    id: "TRANSPORTATION",
    label: "Transportation",
    className: "bg-sky-100 text-sky-950 [&_svg]:text-sky-600",
    items: ["FLIGHT", "STAY", "TRANSPORT", "GAS", "PARKING", "TAXI", "TRAIN", "BICYCLE"],
  },
  {
    id: "UTILITIES",
    label: "Utilities",
    className: "bg-amber-100 text-amber-950 [&_svg]:text-amber-600",
    items: ["ELECTRICITY", "WATER", "INTERNET", "PHONE"],
  },
  {
    id: "GENERAL",
    label: "General",
    className: "bg-slate-200 text-slate-900 [&_svg]:text-slate-500",
    items: ["OTHER"],
  },
] as const;

export const EXPENSE_CATEGORIES = EXPENSE_GROUPS.flatMap((group) => group.items);

export const EXPENSE_CATEGORY_LABELS: Record<(typeof EXPENSE_CATEGORIES)[number] | "SETTLEMENT", string> = {
  ACTIVITY: "Activity",
  GAMES: "Games",
  MOVIES: "Movies",
  MUSIC: "Music",
  SPORTS: "Sports",
  FOOD: "Dining out",
  GROCERIES: "Groceries",
  LIQUOR: "Liquor",
  RENT: "Rent",
  HOUSEHOLD: "Household supplies",
  FURNITURE: "Furniture",
  MAINTENANCE: "Maintenance",
  PETS: "Pets",
  INSURANCE: "Insurance",
  MEDICAL: "Medical",
  CLOTHING: "Clothing",
  EDUCATION: "Education",
  GIFTS: "Gifts",
  FLIGHT: "Flight",
  STAY: "Stay",
  TRANSPORT: "Transport",
  GAS: "Gas",
  PARKING: "Parking",
  TAXI: "Taxi",
  TRAIN: "Train",
  BICYCLE: "Bicycle",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  INTERNET: "Internet",
  PHONE: "Phone",
  OTHER: "General",
  SETTLEMENT: "Payment",
};

export function expenseGroupFor(category: string) {
  return EXPENSE_GROUPS.find((group) => (group.items as readonly string[]).includes(category));
}
