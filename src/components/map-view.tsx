"use client";

import { useEffect, useRef, useState } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

type MapsLibrary = {
  Map: new (
    element: HTMLElement,
    options: { center: { lat: number; lng: number }; zoom: number },
  ) => {
    fitBounds: (bounds: unknown) => void;
  };
  Marker: new (options: {
    position: { lat: number; lng: number };
    map: unknown;
    title: string;
  }) => void;
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
  }
}

export function MapView({ apiKey, markers }: { apiKey: string; markers: MapMarker[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!apiKey);

  const markerKey = markers.map((marker) => `${marker.id}:${marker.lat}:${marker.lng}:${marker.label}`).join("|");

  useEffect(() => {
    if (!apiKey || !ref.current) return;

    let cancelled = false;
    let waitTimer = 0;
    let errorTimer = 0;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) setFailed(true);
      previousAuthFailure?.();
    };

    const draw = async () => {
      const bootstrap = window.google?.maps;
      if (!ref.current || !bootstrap || cancelled) return;
      const load = async (name: string) =>
        typeof bootstrap.importLibrary === "function" ? bootstrap.importLibrary(name) : bootstrap;
      const mapsLibrary = await load("maps");
      const coreLibrary = await load("core");
      const markerLibrary = await load("marker");
      const MapCtor = constructorOf<MapsLibrary["Map"]>(mapsLibrary.Map);
      const BoundsCtor = constructorOf<MapsLibrary["LatLngBounds"]>(coreLibrary.LatLngBounds);
      const MarkerCtor =
        constructorOf<MapsLibrary["Marker"]>(markerLibrary.Marker) ??
        constructorOf<MapsLibrary["Marker"]>(mapsLibrary.Marker) ??
        constructorOf<MapsLibrary["Marker"]>(markerLibrary.AdvancedMarkerElement);
      if (!ref.current || cancelled || !MapCtor) return;

      const center = markers[0] ?? { lat: 20, lng: 0 };
      let map: InstanceType<MapsLibrary["Map"]>;
      try {
        map = new MapCtor(ref.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: markers.length ? 6 : 2,
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

    const start = () => {
      if (cancelled) return;
      if (window.google?.maps) {
        void draw();
        return;
      }
      waitTimer = window.setTimeout(start, 50);
    };

    if (!document.getElementById("google-maps-js")) {
      const script = document.createElement("script");
      script.id = "google-maps-js";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      document.head.appendChild(script);
    }
    start();

    return () => {
      cancelled = true;
      window.clearTimeout(waitTimer);
      window.clearTimeout(errorTimer);
      window.gm_authFailure = previousAuthFailure;
    };
    // markerKey tracks pin changes without restarting the map on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, markerKey]);

  if (!apiKey || failed) {
    return <FallbackPlot markers={markers} missingKey={!apiKey} />;
  }

  return <div ref={ref} className="h-64 w-full rounded-xl ring-1 ring-foreground/10 sm:h-[480px]" />;
}

function FallbackPlot({ markers, missingKey }: { markers: MapMarker[]; missingKey: boolean }) {
  if (markers.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-xl bg-muted px-4 text-center text-sm text-muted-foreground sm:h-[320px]">
        {missingKey
          ? "Add GOOGLE_MAPS_API_KEY to show Google Maps. Destinations you add will still be listed."
          : "Add a destination to see it on the map."}
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
        {missingKey
          ? "This sketch uses the coordinates you saved. Google Maps loads when GOOGLE_MAPS_API_KEY is set."
          : "Google Maps did not load for this key. Destinations still show on this coordinate sketch."}
      </p>
    </div>
  );
}
