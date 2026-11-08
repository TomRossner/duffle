import airports from "@/lib/airports.json";

export type AirportInfo = { code: string; name: string; city: string; country: string };

let index: Map<string, AirportInfo> | null = null;

/** Name, city and country (ISO code) for an IATA airport code, or null when the code is unknown. */
export function airportInfo(code: string): AirportInfo | null {
  index ??= new Map(
    (airports as string[][]).map(([iata, name, city, country]) => [iata, { code: iata, name, city, country }]),
  );
  return index.get(code.trim().toUpperCase()) ?? null;
}
