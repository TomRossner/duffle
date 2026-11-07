"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { countryOptions } from "@/lib/account-details";
import { cn } from "@/lib/utils";

export function CountryPicker({
  name = "country",
  value,
  onValueChange,
}: {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const countries = useMemo(() => countryOptions(), []);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? countries.filter(
        (country) => country.name.toLowerCase().includes(needle) || country.code.toLowerCase().includes(needle),
      )
    : countries;

  return (
    <Select.Root
      name={name}
      value={value || null}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <Select.Trigger
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-base outline-none sm:h-8 sm:px-2 sm:text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50",
        )}
      >
        <Select.Value>
          {(selected: string | null) =>
            selected ? (
              <span className="flex min-w-0 items-center gap-2">
                <CountryFlag code={selected} />
                <span className="truncate">{countries.find((country) => country.code === selected)?.name ?? selected}</span>
              </span>
            ) : (
              "Choose"
            )
          }
        </Select.Value>
        <Select.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50 outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <Select.Popup className="w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover text-sm text-popover-foreground shadow-md outline-none">
            <div className="border-b border-border p-1">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Search countries"
                aria-label="Search countries"
                className="h-11 w-full rounded-md bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground sm:h-8 sm:px-2 sm:text-sm"
              />
            </div>
            <Select.List className="max-h-64 overflow-y-auto p-1">
              {visible.length === 0 ? (
                <p className="px-2 py-1.5 text-muted-foreground">No matches.</p>
              ) : (
                visible.map((country) => (
                  <Select.Item
                    key={country.code}
                    value={country.code}
                    label={country.name}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm outline-none data-highlighted:bg-accent data-selected:bg-muted"
                  >
                    <CountryFlag code={country.code} />
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    <Select.ItemIndicator className="text-foreground">
                      <Check className="size-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))
              )}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
