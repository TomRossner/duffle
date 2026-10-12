export type PlaceTarget = {
  name?: string | null;
  address?: string | null;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function hasPoint(place: PlaceTarget): place is PlaceTarget & { lat: number; lng: number } {
  return (
    place.lat != null &&
    place.lng != null &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function placeQuery(place: PlaceTarget) {
  if (hasPoint(place)) return `${place.lat},${place.lng}`;
  const text = [place.name, place.address].filter((part) => part && part.trim()).join(", ");
  return text || null;
}

export function googleMapsPlaceUrl(place: PlaceTarget) {
  const query = placeQuery(place);
  if (!query) return null;
  const params = new URLSearchParams({ api: "1", query });
  if (place.placeId) params.set("query_place_id", place.placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function googleMapsDirectionsUrl(place: PlaceTarget) {
  const destination = placeQuery(place);
  if (!destination) return null;
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving" });
  if (place.placeId) params.set("destination_place_id", place.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function wazeUrl(place: PlaceTarget) {
  if (hasPoint(place)) {
    const params = new URLSearchParams({
      ll: `${place.lat},${place.lng}`,
      navigate: "yes",
    });
    return `https://waze.com/ul?${params.toString()}`;
  }
  const text = [place.name, place.address].filter((part) => part && part.trim()).join(", ");
  if (!text) return null;
  const params = new URLSearchParams({ q: text, navigate: "yes" });
  return `https://waze.com/ul?${params.toString()}`;
}
