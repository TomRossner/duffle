"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { useEffect, useState } from "react";
import { AirlineLogo } from "@/components/airline-logo";
import { CountryFlag } from "@/components/country-flag";
import { Input } from "@/components/ui/input";
import { airportCodeOf } from "@/lib/flight-lookup";
import { cn } from "@/lib/utils";

/** [IATA code, name, city, country code] — built by scripts/build-flight-data.mjs. */
type Airport = [string, string, string, string];
/** [name, IATA code] */
type Airline = [string, string];

const LIMIT = 8;

let airportsPromise: Promise<Airport[]> | null = null;
let airportIndexPromise: Promise<Map<string, Airport>> | null = null;
let airlinesPromise: Promise<Airline[]> | null = null;

// The lists are large, so they load on first focus instead of with the page.
function loadAirports() {
  airportsPromise ??= import("@/lib/airports.json").then((data) => data.default as Airport[]);
  return airportsPromise;
}

function loadAirportIndex() {
  airportIndexPromise ??= loadAirports().then((airports) => new Map(airports.map((airport) => [airport[0], airport])));
  return airportIndexPromise;
}

/** The bundled details for an airport code, once the list has loaded. */
export function useAirport(code: string) {
  const [index, setIndex] = useState<Map<string, Airport> | null>(null);
  useEffect(() => {
    if (code) void loadAirportIndex().then(setIndex);
  }, [code]);
  return code ? (index?.get(code.toUpperCase()) ?? null) : null;
}

/** What an airport field shows once an airport is chosen: the code and the full airport name. */
function airportText([code, airportName]: Airport) {
  return `${code} · ${airportName}`;
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
  toSubmitted,
  expandDefault,
  adornment,
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
  /** The submitted value for the field's text, when it differs from the text. */
  toSubmitted?: (text: string) => string;
  /** The text to show for the default value, once the items have loaded (a code → its full name). */
  expandDefault?: () => Promise<string | null>;
  /** Shown at the end of the field, for the current text. */
  adornment?: (text: string) => React.ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<T[] | null>(null);
  const suggestions = items ? match(items, value) : [];
  const end = adornment?.(value);

  useEffect(() => {
    if (!defaultValue || !expandDefault) return;
    let current = true;
    void expandDefault().then((text) => {
      // Only replace the text if nobody has typed in the field meanwhile.
      if (current && text) setValue((now) => (now === defaultValue ? text : now));
    });
    return () => {
      current = false;
    };
    // The default only expands once, for the value the field mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Autocomplete.Root
      name={toSubmitted ? undefined : name}
      required={required}
      value={value}
      onValueChange={setValue}
      filteredItems={suggestions}
      itemToStringValue={toValue}
      autoHighlight
    >
      <div className="relative">
        <Autocomplete.Input
          render={<Input className={end ? "pr-10" : undefined} />}
          placeholder={placeholder}
          autoComplete="off"
          title={end ? value : undefined}
          onFocus={() => {
            if (!items) void load().then(setItems);
          }}
        />
        {end ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">{end}</span>
        ) : null}
      </div>
      {toSubmitted ? <input type="hidden" name={name} value={toSubmitted(value)} /> : null}
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
        // A chosen airport's own text needs no suggestions.
        airports.some((airport) => airportText(airport) === query)
          ? []
          : rank(
              airports,
              query,
              (airport) => airport[0],
              (airport) => [airport[2], airport[1]],
            )
      }
      toValue={airportText}
      toSubmitted={airportCodeOf}
      expandDefault={() =>
        loadAirportIndex().then((index) => {
          const airport = index.get(airportCodeOf(defaultValue));
          return airport ? airportText(airport) : null;
        })
      }
      adornment={(text) => <AirportFlag text={text} />}
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
          <AirlineLogo code={code} />
          <span className="min-w-0 flex-1 truncate">{airlineName}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{code}</span>
        </>
      )}
    />
  );
}

/** The country flag for the airport in an airport field, as the suggestions show it. */
function AirportFlag({ text }: { text: string }) {
  const code = airportCodeOf(text);
  const airport = useAirport(/^[A-Z0-9]{3}$/.test(code) ? code : "");
  return airport?.[3] ? <CountryFlag code={airport[3]} /> : null;
}

/** An airport code with its full name and city, from the bundled list, for read-only summaries. */
export function AirportLabel({
  code,
  fallbackName = "",
  align = "start",
}: {
  code: string;
  fallbackName?: string;
  align?: "start" | "end";
}) {
  const airport = useAirport(code);
  const airportName = airport?.[1] || fallbackName;
  const city = airport?.[2] ?? "";
  return (
    // Right-aligned with text-right, not justify-items-end: that sizes the name to its text, so a long
    // name grows past the column instead of wrapping inside it.
    <span className={cn("grid min-w-0", align === "end" && "text-right")}>
      <span className={cn("flex items-center gap-1.5", align === "end" && "flex-row-reverse")}>
        <span className="font-mono text-base font-semibold">{code}</span>
        {airport?.[3] ? <CountryFlag code={airport[3]} /> : null}
      </span>
      {airportName ? (
        // Two lines fit most names on a phone, where one line kept only a word or two.
        <span className="line-clamp-2 text-xs break-words text-muted-foreground" title={airportName}>
          {airportName}
          {city && !airportName.includes(city) ? `, ${city}` : ""}
        </span>
      ) : null}
    </span>
  );
}
