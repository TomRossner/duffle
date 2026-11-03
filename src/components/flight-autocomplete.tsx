"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { Input } from "@/components/ui/input";

/** [IATA code, name, city, country code] — built by scripts/build-flight-data.mjs. */
type Airport = [string, string, string, string];
/** [name, IATA code] */
type Airline = [string, string];

const LIMIT = 8;

let airportsPromise: Promise<Airport[]> | null = null;
let airlinesPromise: Promise<Airline[]> | null = null;

// The lists are large, so they load on first focus instead of with the page.
function loadAirports() {
  airportsPromise ??= import("@/lib/airports.json").then((data) => data.default as Airport[]);
  return airportsPromise;
}

function loadAirlines() {
  airlinesPromise ??= import("@/lib/airlines.json").then((data) => data.default as Airline[]);
  return airlinesPromise;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Best matches first: exact code, then names/cities starting with the query, then anywhere. */
function rank<T>(items: T[], query: string, code: (item: T) => string, texts: (item: T) => string[]) {
  const needle = normalize(query);
  if (!needle) return [];
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const itemCode = code(item).toLowerCase();
    const words = texts(item).map(normalize);
    let score = -1;
    if (itemCode === needle) score = 0;
    else if (words.some((word) => word.startsWith(needle))) score = 1;
    else if (words.some((word) => word.split(/[\s\-/()]+/).some((part) => part.startsWith(needle)))) score = 2;
    else if (itemCode.startsWith(needle)) score = 3;
    else if (words.some((word) => word.includes(needle))) score = 4;
    if (score >= 0) scored.push({ item, score });
  }
  // Stable sort keeps the data order (bigger airports first) within a score.
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, LIMIT)
    .map((entry) => entry.item);
}

function SuggestInput<T>({
  name,
  defaultValue,
  placeholder,
  required,
  load,
  match,
  toValue,
  itemKey,
  renderItem,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  load: () => Promise<T[]>;
  match: (items: T[], query: string) => T[];
  toValue: (item: T) => string;
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<T[] | null>(null);
  const suggestions = items ? match(items, value) : [];

  return (
    <Autocomplete.Root
      name={name}
      required={required}
      value={value}
      onValueChange={setValue}
      filteredItems={suggestions}
      itemToStringValue={toValue}
      autoHighlight
    >
      <Autocomplete.Input
        render={<Input />}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          if (!items) void load().then(setItems);
        }}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="z-50 outline-none" sideOffset={6}>
          <Autocomplete.Popup className="w-[max(var(--anchor-width),18rem)] max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover text-sm text-popover-foreground shadow-md outline-none data-empty:hidden">
            <Autocomplete.List className="max-h-72 overflow-y-auto p-1 outline-none data-empty:p-0">
              {(item: T) => (
                <Autocomplete.Item
                  key={itemKey(item)}
                  value={item}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-accent"
                >
                  {renderItem(item)}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

export function AirportInput({
  name,
  defaultValue = "",
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <SuggestInput<Airport>
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      load={loadAirports}
      match={(airports, query) =>
        rank(
          airports,
          query,
          (airport) => airport[0],
          (airport) => [airport[2], airport[1]],
        )
      }
      toValue={(airport) => airport[0]}
      itemKey={(airport) => airport[0]}
      renderItem={([code, airportName, city, country]) => (
        <>
          <span className="w-9 shrink-0 font-mono text-xs font-semibold">{code}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{city || airportName}</span>
            {city ? <span className="block truncate text-xs text-muted-foreground">{airportName}</span> : null}
          </span>
          {country ? <CountryFlag code={country} /> : null}
        </>
      )}
    />
  );
}

export function AirlineInput({
  name,
  defaultValue = "",
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <SuggestInput<Airline>
      name={name}
      defaultValue={defaultValue}
      required={required}
      load={loadAirlines}
      match={(airlines, query) =>
        rank(
          airlines,
          query,
          (airline) => airline[1],
          (airline) => [airline[0]],
        )
      }
      toValue={(airline) => airline[0]}
      itemKey={(airline) => `${airline[0]}-${airline[1]}`}
      renderItem={([airlineName, code]) => (
        <>
          <span className="min-w-0 flex-1 truncate">{airlineName}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{code}</span>
        </>
      )}
    />
  );
}
