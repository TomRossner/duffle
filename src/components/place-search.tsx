"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPlacesAction } from "@/lib/actions/destinations";
import { useT } from "@/i18n/client";
import type { PlaceResult } from "@/lib/places";

export function PlaceSearch({
  onPick,
}: {
  onPick: (place: PlaceResult) => void;
}) {
  const t = useT("map");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search() {
    if (!query.trim() || pending) return;
    startTransition(async () => {
      const response = await searchPlacesAction(query);
      setError("error" in response && typeof response.error === "string" ? response.error : null);
      setResults(response.results);
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground sm:start-2.5" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Enter searches instead of submitting the surrounding form.
              if (event.key === "Enter") {
                event.preventDefault();
                search();
              }
            }}
            placeholder={t("search.placeholder")}
            enterKeyHint="search"
            className="ps-9 sm:ps-8"
          />
        </div>
        <Button type="button" variant="outline" className="shrink-0" disabled={pending || !query.trim()} onClick={search}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          {pending ? t("search.searching") : t("search.search")}
        </Button>
      </div>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="grid gap-1">
          {results.map((place) => (
            <li key={place.placeId || place.name}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2.5 text-start text-base hover:bg-muted sm:px-2 sm:py-1.5 sm:text-sm"
                onClick={() => {
                  onPick(place);
                  setResults([]);
                }}
              >
                <span className="font-medium">{place.name}</span>
                <span className="block text-muted-foreground">{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
