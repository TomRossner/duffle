"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPlacesAction } from "@/lib/actions/destinations";
import type { PlaceResult } from "@/lib/places";

export function PlaceSearch({
  onPick,
}: {
  onPick: (place: PlaceResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a city or place"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const response = await searchPlacesAction(query);
              setError("error" in response && typeof response.error === "string" ? response.error : null);
              setResults(response.results);
            });
          }}
        >
          {pending ? "Searching..." : "Search"}
        </Button>
      </div>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="grid gap-1">
          {results.map((place) => (
            <li key={place.placeId || place.name}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
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
