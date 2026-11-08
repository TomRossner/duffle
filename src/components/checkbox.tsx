import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckBox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type="checkbox"
        className={cn(
          "peer size-5 cursor-pointer appearance-none rounded-full border border-input bg-background shadow-sm",
          "checked:border-primary checked:bg-primary",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground! opacity-0 peer-checked:opacity-100" />
    </span>
  );
}
