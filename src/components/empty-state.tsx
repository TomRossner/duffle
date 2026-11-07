import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** What goes in an empty section, and the next step to fill it. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  compact,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 text-center",
        compact ? "py-6" : "py-10",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {children ? <div className="max-w-md text-sm text-pretty text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-2 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">{action}</div> : null}
    </div>
  );
}
