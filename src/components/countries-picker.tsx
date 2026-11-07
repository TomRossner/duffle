"use client";

import { Combobox } from "@base-ui/react/combobox";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { countryName, countryOptions } from "@/lib/account-details";
import { cn } from "@/lib/utils";

type Country = { value: string; label: string };

export function CountriesPicker({ name = "countries", defaultValue = [] }: { name?: string; defaultValue?: string[] }) {
  const items = useMemo<Country[]>(
    () => countryOptions().map((country) => ({ value: country.code, label: country.name })),
    [],
  );
  const [selected, setSelected] = useState<Country[]>(() =>
    defaultValue.map((code) => items.find((item) => item.value === code) ?? { value: code, label: countryName(code) }),
  );

  return (
    <Combobox.Root
      items={items}
      multiple
      value={selected}
      onValueChange={(next: Country[]) => setSelected(next)}
      isItemEqualToValue={(item: Country, value: Country) => item.value === value.value}
      autoHighlight
    >
      {selected.map((country) => (
        <input key={country.value} type="hidden" name={name} value={country.value} />
      ))}
      <Combobox.InputGroup
        className={cn(
          "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-1.5 py-1 text-base sm:min-h-8 sm:text-sm",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        )}
      >
        <Combobox.Chips className="flex w-full flex-wrap items-center gap-1">
          {selected.map((country) => (
            <Combobox.Chip
              key={country.value}
              aria-label={country.label}
              className="flex items-center gap-1.5 rounded-md bg-muted py-0.5 pr-0.5 pl-1.5 outline-none focus-within:ring-2 focus-within:ring-ring/50 data-highlighted:bg-accent"
            >
              <CountryFlag code={country.value} />
              {country.label}
              <Combobox.ChipRemove
                aria-label={`Remove ${country.label}`}
                className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </Combobox.ChipRemove>
            </Combobox.Chip>
          ))}
          <Combobox.Input
            aria-label="Countries"
            placeholder={selected.length > 0 ? "Add another country" : "Type a country"}
            autoComplete="off"
            onKeyDown={(event) => {
              // While a country is being typed, Enter picks it (the combobox handles that) instead of submitting the form.
              if (event.key === "Enter" && event.currentTarget.value.trim()) event.preventDefault();
            }}
            className="h-6 min-w-32 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground"
          />
        </Combobox.Chips>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={6}>
          <Combobox.Popup className="max-h-[min(var(--available-height),18rem)] w-[max(var(--anchor-width),16rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            <Combobox.Empty>
              <p className="px-2 py-1.5 text-muted-foreground">No matches.</p>
            </Combobox.Empty>
            <Combobox.List>
              {(country: Country) => (
                <Combobox.Item
                  key={country.value}
                  value={country}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm outline-none select-none data-highlighted:bg-accent data-selected:font-medium"
                >
                  <CountryFlag code={country.value} />
                  <span className="min-w-0 flex-1 truncate">{country.label}</span>
                  <Combobox.ItemIndicator className="text-xs text-muted-foreground">Added</Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
