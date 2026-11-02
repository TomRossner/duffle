import iataCountries from "@/lib/iata-countries.json";
import { countryCodeForName } from "@/lib/account-details";
import { destinationCountry } from "@/lib/personal-documents";

const countries = iataCountries as Record<string, string>;

export function countryForAirport(code: string) {
  return countries[code.trim().toUpperCase()] ?? null;
}

export function countryForAddress(address: string | null | undefined) {
  const name = destinationCountry(address);
  return name ? countryCodeForName(name) : null;
}

export function flagsForTrip(input: {
  homeCountry: string | null | undefined;
  flights: { toAirport: string; departAt: Date }[];
  destinations: { address: string | null; startDate: Date }[];
}) {
  const home = input.homeCountry?.trim().toUpperCase() || null;
  const stops = [
    ...input.flights.map((flight) => ({ at: flight.departAt, code: countryForAirport(flight.toAirport) })),
    ...input.destinations.map((destination) => ({
      at: destination.startDate,
      code: countryForAddress(destination.address),
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const seen = new Set<string>();
  const codes: string[] = [];
  for (const stop of stops) {
    const code = stop.code?.toUpperCase();
    if (!code || code === home || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}
