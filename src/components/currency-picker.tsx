"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, CURRENCY_NAMES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CurrencyCode = (typeof CURRENCIES)[number];

function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

function CurrencyRow({ code, showName = false }: { code: string; showName?: boolean }) {
  const symbol = isCurrency(code) ? CURRENCY_SYMBOLS[code] : "";
  const name = isCurrency(code) ? CURRENCY_NAMES[code] : code;

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="w-10 shrink-0 text-center font-medium [font-family:system-ui,sans-serif]">{symbol}</span>
      <span className="w-8 shrink-0 font-medium tracking-wide">{code}</span>
      {showName ? <span className="truncate text-muted-foreground">{name}</span> : null}
    </span>
  );
}

export function CurrencyPicker({
  name = "currency",
  defaultValue = "USD",
  onValueChange,
}: {
  name?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Select.Root
      name={name}
      defaultValue={defaultValue}
      onValueChange={(value: string | null) => {
        if (value) onValueChange?.(value);
      }}
    >
      <Select.Trigger
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-base outline-none sm:h-8 sm:px-2 sm:text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50",
        )}
      >
        <Select.Value>{(value: string | null) => (value ? <CurrencyRow code={value} /> : "Currency")}</Select.Value>
        <Select.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50 outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <Select.Popup className="max-h-80 w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            <Select.List>
              {CURRENCIES.map((code) => (
                <Select.Item
                  key={code}
                  value={code}
                  label={`${code} ${CURRENCY_NAMES[code]}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm outline-none data-highlighted:bg-accent data-selected:bg-muted"
                >
                  <CurrencyRow code={code} showName />
                  <Select.ItemIndicator className="ml-auto text-foreground">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
