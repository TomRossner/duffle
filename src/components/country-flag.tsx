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

const MAX_FLAGS = 4;

// While the row is hovered, the flags pull apart and tilt alternately.
const MOTION = "transition-[margin,rotate] duration-200 ease-out";
const SPREAD = "-ml-3 group-hover/flags:ml-1.5";
const TILT = ["group-hover/flags:-rotate-6", "group-hover/flags:rotate-6"];

function StackedFlag({ code, index, zIndex }: { code: string; index: number; zIndex: number }) {
  return (
    <span
      className={cn("relative flex rounded-[4px] bg-background p-0.5", MOTION, TILT[index % 2], index > 0 && SPREAD)}
      style={{ zIndex }}
    >
      <CountryFlag code={code} className="h-6 w-9 rounded-[3px] shadow-none" />
    </span>
  );
}

/**
 * A straight, overlapping row of flags. Past MAX_FLAGS the rest collapse into a "+N" badge.
 * Hovering the row spreads the flags out, tilts them, and shows the collapsed ones.
 */
export function FlagStack({ codes, label }: { codes: string[]; label: string }) {
  if (codes.length === 0) return null;
  const shown = codes.length > MAX_FLAGS ? codes.slice(0, MAX_FLAGS - 1) : codes;
  const hidden = codes.slice(shown.length);
  return (
    <span role="img" aria-label={label} title={label} className="group/flags inline-flex h-lh shrink-0 items-center">
      {shown.map((code, index) => (
        <StackedFlag key={code} code={code} index={index} zIndex={codes.length - index} />
      ))}
      {hidden.length > 0 ? (
        <>
          <span className="relative -ml-3 flex rounded-[4px] bg-background p-0.5 group-hover/flags:hidden" style={{ zIndex: hidden.length }}>
            <span className="flex h-6 min-w-9 items-center justify-center rounded-[3px] bg-muted px-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/15">
              +{hidden.length}
            </span>
          </span>
          {hidden.map((code, index) => (
            <span key={code} className="hidden group-hover/flags:flex">
              <StackedFlag code={code} index={shown.length + index} zIndex={hidden.length - index} />
            </span>
          ))}
        </>
      ) : null}
    </span>
  );
}
