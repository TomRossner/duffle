"use client";

import { useId } from "react";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Navigation } from "lucide-react";
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

// A stronger edge than the default outline, so the buttons stand out on the grey cards they sit on.
const linkButtonClass = cn(
  buttonVariants({ variant: "outline", size: "xs" }),
  "border-foreground/25 shadow-xs dark:border-foreground/25",
);

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

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
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
      {/* On phones the buttons share a full-width row; from sm up they sit inline at their natural width. */}
      <span className="flex w-full items-center gap-1.5 *:flex-1 sm:inline-flex sm:w-auto sm:*:flex-none">
        {maps ? (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className={linkButtonClass}
            aria-label={`Show ${name} on Google Maps`}
          >
            <GoogleMapsIcon />
            Show on Maps
          </a>
        ) : null}
        {directions || waze ? (
          <Menu.Root>
            <Menu.Trigger
              className={linkButtonClass}
              aria-label={`Get directions to ${name}`}
            >
              <Navigation className="size-4" />
              Get directions
              <ChevronDown className="size-3 opacity-60" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-[90] outline-none" sideOffset={4} align="start">
                <Menu.Popup className="min-w-40 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">Navigate with</p>
                  {directions ? (
                    <Menu.LinkItem
                      href={directions}
                      target="_blank"
                      rel="noreferrer"
                      closeOnClick
                      className={menuItemClass}
                    >
                      <GoogleMapsIcon />
                      Google Maps
                    </Menu.LinkItem>
                  ) : null}
                  {waze ? (
                    <Menu.LinkItem href={waze} target="_blank" rel="noreferrer" closeOnClick className={menuItemClass}>
                      <WazeIcon />
                      Waze
                    </Menu.LinkItem>
                  ) : null}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : null}
      </span>
    </span>
  );
}
