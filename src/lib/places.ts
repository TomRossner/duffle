export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(query: string): Promise<
  | { results: PlaceResult[] }
  | { error: string; results: PlaceResult[] }
> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return {
      error: "Add GOOGLE_MAPS_API_KEY to search places. You can still enter a name and coordinates.",
      results: [],
    };
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
    return { error: "Place search failed. Check the Google Maps key and enabled APIs.", results: [] };
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
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !address.trim()) return null;

  const params = new URLSearchParams({ address, key });
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  };
  const location = data.results?.[0]?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}
