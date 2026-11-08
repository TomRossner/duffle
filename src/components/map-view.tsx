"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/i18n/client";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

type MapsLibrary = {
  Map: new (
    element: HTMLElement,
    options: { center: { lat: number; lng: number }; zoom: number; mapId: string },
  ) => {
    fitBounds: (bounds: unknown) => void;
  };
  AdvancedMarkerElement: new (options: {
    position: { lat: number; lng: number };
    map: unknown;
    title: string;
  }) => unknown;
  LatLngBounds: new () => {
    extend: (position: { lat: number; lng: number }) => void;
  };
};

type LibraryRecord = Record<string, unknown>;

type GoogleNamespace = {
  maps: {
    importLibrary?: (name: string) => Promise<LibraryRecord>;
  } & LibraryRecord;
};

function constructorOf<T>(value: unknown): T | null {
  return typeof value === "function" ? (value as T) : null;
}

declare global {
  interface Window {
    google?: GoogleNamespace;
    gm_authFailure?: () => void;
    __duffleMapsReady?: () => void;
  }
}

let mapsLoader: Promise<GoogleNamespace["maps"]> | null = null;

/**
 * Loads the Maps script once and resolves when Google calls back, i.e. once `importLibrary` is usable.
 * Waiting for `window.google.maps` alone is not enough: on a cold load it exists before the API is ready.
 */
function loadGoogleMaps(apiKey: string, language: string) {
  if (window.google?.maps && typeof window.google.maps.importLibrary === "function") {
    return Promise.resolve(window.google.maps);
  }
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise((resolve, reject) => {
    window.__duffleMapsReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps did not initialise."));
    };
    document.getElementById("google-maps-js")?.remove();
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=${encodeURIComponent(language)}&loading=async&callback=__duffleMapsReady`;
    script.async = true;
    script.onerror = () => {
      script.remove();
      reject(new Error("Google Maps failed to load."));
    };
    document.head.appendChild(script);
  });
  // Let a later mount try again after a failed load.
  mapsLoader.catch(() => {
    mapsLoader = null;
  });
  return mapsLoader;
}

/** Advanced markers need a map ID. Google's demo ID works without setup; set GOOGLE_MAPS_MAP_ID for your own. */
const DEMO_MAP_ID = "DEMO_MAP_ID";

export function MapView({
  apiKey,
  mapId,
  markers,
}: {
  apiKey: string;
  mapId?: string;
  markers: MapMarker[];
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!apiKey);

  const markerKey = markers.map((marker) => `${marker.id}:${marker.lat}:${marker.lng}:${marker.label}`).join("|");

  useEffect(() => {
    if (!apiKey || !ref.current) return;

    let cancelled = false;
    let errorTimer = 0;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) setFailed(true);
      previousAuthFailure?.();
    };

    const draw = async () => {
      const bootstrap = await loadGoogleMaps(apiKey, locale);
      if (!ref.current || cancelled) return;
      const load = async (name: string) =>
        typeof bootstrap.importLibrary === "function" ? bootstrap.importLibrary(name) : bootstrap;
      const [mapsLibrary, coreLibrary, markerLibrary] = await Promise.all([load("maps"), load("core"), load("marker")]);
      const MapCtor = constructorOf<MapsLibrary["Map"]>(mapsLibrary.Map);
      const BoundsCtor = constructorOf<MapsLibrary["LatLngBounds"]>(coreLibrary.LatLngBounds);
      const MarkerCtor = constructorOf<MapsLibrary["AdvancedMarkerElement"]>(markerLibrary.AdvancedMarkerElement);
      if (!ref.current || cancelled) return;
      if (!MapCtor) {
        setFailed(true);
        return;
      }

      const center = markers[0] ?? { lat: 20, lng: 0 };
      let map: InstanceType<MapsLibrary["Map"]>;
      try {
        map = new MapCtor(ref.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: markers.length ? 6 : 2,
          mapId: mapId || DEMO_MAP_ID,
        });
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      for (const marker of markers) {
        const position = { lat: marker.lat, lng: marker.lng };
        if (MarkerCtor) new MarkerCtor({ position, map, title: marker.label });
      }
      if (markers.length > 1 && BoundsCtor) {
        const bounds = new BoundsCtor();
        for (const marker of markers) bounds.extend({ lat: marker.lat, lng: marker.lng });
        map.fitBounds(bounds);
      }
      errorTimer = window.setTimeout(() => {
        if (!cancelled && ref.current?.querySelector(".gm-err-container, .gm-err-message")) setFailed(true);
      }, 800);
    };

    draw().catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(errorTimer);
      window.gm_authFailure = previousAuthFailure;
    };
    // markerKey tracks pin changes without restarting the map on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapId, markerKey, locale]);

  if (!apiKey || failed) {
    return <FallbackPlot markers={markers} missingKey={!apiKey} />;
  }

  return <div ref={ref} className="h-64 w-full rounded-xl ring-1 ring-foreground/10 sm:h-[480px]" />;
}

function FallbackPlot({ markers, missingKey }: { markers: MapMarker[]; missingKey: boolean }) {
  const t = useT("map");
  if (markers.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-xl bg-muted px-4 text-center text-sm text-muted-foreground sm:h-[320px]">
        {missingKey ? t("view.noKey") : t("view.addOne")}
      </div>
    );
  }

  const lats = markers.map((marker) => marker.lat);
  const lngs = markers.map((marker) => marker.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.5);
  const lngSpan = Math.max(maxLng - minLng, 0.5);

  return (
    <div className="grid gap-3">
      <div className="relative h-64 rounded-xl bg-muted ring-1 ring-foreground/10 sm:h-[320px]">
        {markers.map((marker) => {
          const x = ((marker.lng - minLng) / lngSpan) * 80 + 10;
          const y = (1 - (marker.lat - minLat) / latSpan) * 80 + 10;
          return (
            <span
              key={marker.id}
              title={marker.label}
              className="absolute max-w-32 -translate-x-1/2 -translate-y-1/2 truncate rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {marker.label}
            </span>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {missingKey ? t("view.sketchNoKey") : t("view.sketchFailed")}
      </p>
    </div>
  );
}
