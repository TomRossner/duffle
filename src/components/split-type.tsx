import { Coins, Equal, Percent, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SPLIT_TYPES = [
  { id: "EQUAL", label: "Equal", description: "Split equally", Icon: Equal },
  { id: "EXACT", label: "Exact", description: "Split by exact amounts", Icon: Coins },
  { id: "PERCENT", label: "Percent", description: "Split by percent", Icon: Percent },
] as const satisfies readonly { id: string; label: string; description: string; Icon: LucideIcon }[];

function splitMeta(splitType: string) {
  return SPLIT_TYPES.find((type) => type.id === splitType) ?? SPLIT_TYPES[0];
}

/** The icon for how an expense is split, labelled for screen readers. */
export function SplitTypeIcon({ splitType, className }: { splitType: string; className?: string }) {
  const { Icon, description } = splitMeta(splitType);
  return (
    <span title={description} className="inline-flex shrink-0">
      <Icon className={cn("size-3.5", className)} aria-hidden />
      <span className="sr-only">{description}</span>
    </span>
  );
}

/** Segmented picker for the split type; submits as `name`. */
export function SplitTypePicker({
  name,
  value,
  onValueChange,
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" className="grid h-11 grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:h-8 sm:p-0.5">
      {SPLIT_TYPES.map(({ id, label, description, Icon }) => (
        <label
          key={id}
          title={description}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-base font-medium text-muted-foreground transition-colors select-none hover:text-foreground sm:text-sm",
            "has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm",
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          )}
        >
          <input
            type="radio"
            name={name}
            value={id}
            checked={value === id}
            onChange={() => onValueChange(id)}
            className="sr-only"
          />
          <Icon className="size-4 shrink-0" aria-hidden />
          {label}
        </label>
      ))}
    </div>
  );
}
