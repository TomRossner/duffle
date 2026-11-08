import { getT } from "@/i18n/server";
export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

// Server-side calls send no browser referrer, so a key restricted to websites is rejected here.
// GOOGLE_MAPS_SERVER_KEY is meant to be restricted by server IP instead.
function serverKey() {
  return process.env.GOOGLE_MAPS_SERVER_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim();
}

async function logGoogleError(api: string, response: Response) {
  const body = await response.text().catch(() => "");
  console.error(`[google] ${api} failed with ${response.status}: ${body.slice(0, 500)}`);
}

export async function searchPlaces(query: string): Promise<
  | { results: PlaceResult[] }
  | { error: string; results: PlaceResult[] }
> {
  const key = serverKey();
  if (!key) {
    return { error: (await getT("map"))("errors.noKey"), results: [] };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5 }),
    cache: "no-store",
  });

  if (!response.ok) {
    await logGoogleError("Places searchText", response);
    return { error: (await getT("map"))("errors.searchFailed"), results: [] };
  }

  const data = (await response.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    }[];
  };

  const results = (data.places ?? [])
    .filter((place) => place.location?.latitude != null && place.location.longitude != null)
    .map((place) => ({
      placeId: place.id ?? "",
      name: place.displayName?.text ?? "Place",
      address: place.formattedAddress ?? "",
      lat: place.location!.latitude!,
      lng: place.location!.longitude!,
    }));

  return { results };
}

export async function geocodeAddress(address: string) {
  const key = serverKey();
  if (!key || !address.trim()) return null;

  const params = new URLSearchParams({ address, key });
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    await logGoogleError("Geocoding", response);
    return null;
  }
  const data = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  };
  // Geocoding reports key problems as HTTP 200 with a status field.
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error(`[google] Geocoding returned ${data.status}: ${data.error_message ?? ""}`);
  }
  const location = data.results?.[0]?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}
