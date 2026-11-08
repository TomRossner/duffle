import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

const flags = Flags as Record<string, (typeof Flags)[keyof typeof Flags]>;

export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const Flag = flags[code];
  if (!Flag) return null;
  return (
    <Flag
      aria-hidden
      className={cn("h-4 w-6 shrink-0 rounded-[2px] shadow-sm ring-1 ring-foreground/15", className)}
    />
  );
}

// While the row is hovered, the flags pull apart and tilt alternately.
const MOTION = "transition-[margin,rotate] duration-200 ease-out";
const TILT = ["group-hover/flags:-rotate-6", "group-hover/flags:rotate-6"];
const SIZES = {
  default: { overlap: "-ml-3", spread: "-ml-3 group-hover/flags:ml-1.5", flag: "h-6 w-9", badge: "h-6 min-w-9 text-xs" },
  // The row under a trip's name.
  sm: { overlap: "-ml-2.5", spread: "-ml-2.5 group-hover/flags:ml-1", flag: "h-5 w-7.5", badge: "h-5 min-w-7.5 text-[0.6875rem] leading-none" },
};
type FlagSize = keyof typeof SIZES;

function StackedFlag({ code, index, zIndex, size }: { code: string; index: number; zIndex: number; size: FlagSize }) {
  return (
    <span
      className={cn(
        "relative flex rounded-[4px] bg-background p-0.5",
        MOTION,
        TILT[index % 2],
        index > 0 && SIZES[size].spread,
      )}
      style={{ zIndex }}
    >
      <CountryFlag code={code} className={cn("rounded-[3px] shadow-none", SIZES[size].flag)} />
    </span>
  );
}

/**
 * A straight, overlapping row of flags. Only the first `max` show; the rest collapse into a "+N" badge.
 * Hovering the row spreads the flags out, tilts them, and shows the collapsed ones.
 */
export function FlagStack({
  codes,
  label,
  max = 4,
  size = "default",
}: {
  codes: string[];
  label: string;
  max?: number;
  size?: FlagSize;
}) {
  if (codes.length === 0) return null;
  // A "+1" badge takes the same room as the flag it would hide.
  const shown = codes.length > max ? codes.slice(0, max - 1) : codes;
  const hidden = codes.slice(shown.length);
  return (
    <span role="img" aria-label={label} title={label} className="group/flags inline-flex h-lh shrink-0 items-center">
      {shown.map((code, index) => (
        <StackedFlag key={code} code={code} index={index} zIndex={codes.length - index} size={size} />
      ))}
      {hidden.length > 0 ? (
        <>
          <span
            className={cn(
              "relative flex rounded-[4px] bg-background p-0.5 group-hover/flags:hidden",
              SIZES[size].overlap,
            )}
            style={{ zIndex: hidden.length }}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-[3px] bg-muted px-1 font-medium text-muted-foreground ring-1 ring-foreground/15",
                SIZES[size].badge,
              )}
            >
              +{hidden.length}
            </span>
          </span>
          {hidden.map((code, index) => (
            <span key={code} className="hidden group-hover/flags:flex">
              <StackedFlag code={code} index={shown.length + index} zIndex={hidden.length - index} size={size} />
            </span>
          ))}
        </>
      ) : null}
    </span>
  );
}
