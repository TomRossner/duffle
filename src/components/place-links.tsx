import { useId } from "react";
import { Navigation } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { googleMapsDirectionsUrl, googleMapsPlaceUrl, wazeUrl, type PlaceTarget } from "@/lib/place-links";
import { cn } from "@/lib/utils";

function GoogleMapsIcon() {
  const filterId = useId().replace(/:/g, "");
  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 1 0 -0.15" />
        </filter>
      </svg>
      <img
        src="/Google_Maps_icon_(2026).svg.webp"
        alt=""
        className="size-4 shrink-0"
        style={{ filter: `url(#${filterId})` }}
      />
    </>
  );
}

function WazeIcon() {
  return (
    <img
      src="/waze-icon-design-can-use-web-mobile-app-vector-illustration-288650671.webp"
      alt=""
      className="size-4 shrink-0 object-contain"
    />
  );
}

export function PlaceLinks({
  place,
  label,
  className,
}: {
  place: PlaceTarget;
  label?: string;
  className?: string;
}) {
  const name = place.name?.trim() || place.address?.trim() || "this place";
  const maps = googleMapsPlaceUrl(place);
  const directions = googleMapsDirectionsUrl(place);
  const waze = wazeUrl(place);
  if (!maps && !directions && !waze) return null;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
      {maps ? (
        <a
          href={maps}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "xs" })}
          aria-label={`Open ${name} in Google Maps`}
        >
          <GoogleMapsIcon />
          Maps
        </a>
      ) : null}
      {directions ? (
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "xs" })}
          aria-label={`Directions to ${name}`}
        >
          <Navigation className="size-4" />
          Directions
        </a>
      ) : null}
      {waze ? (
        <a
          href={waze}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "xs" })}
          aria-label={`Navigate to ${name} in Waze`}
        >
          <WazeIcon />
          Waze
        </a>
      ) : null}
    </span>
  );
}
