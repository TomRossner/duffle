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

const FLAG_WIDTH = 36;
const FLAG_HEIGHT = 24;
const STACK_X = 20;
const STACK_Y = 6;

export function FlagStack({ codes, label }: { codes: string[]; label: string }) {
  if (codes.length === 0) return null;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative inline-block shrink-0"
      style={{
        width: FLAG_WIDTH + (codes.length - 1) * STACK_X + 10,
        height: FLAG_HEIGHT + (codes.length - 1) * STACK_Y + 10,
      }}
    >
      {codes.map((code, index) => (
        <span
          key={code}
          className="absolute"
          style={{
            left: 4 + index * STACK_X,
            top: 2 + index * STACK_Y,
            zIndex: index + 1,
            transform: `rotate(${index % 2 === 0 ? -7 : 6}deg)`,
          }}
        >
          <CountryFlag code={code} className="h-6 w-9 shadow-md ring-2 ring-background" />
        </span>
      ))}
    </span>
  );
}
