"use client";

import { Plane } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * An airline's tail logo by IATA code, from the images Google Flights uses. They're square, small, and
 * show a plain tail fin for codes Google does not know. A plane icon stands in when there is no code or
 * the image fails to load.
 */
export function AirlineLogo({ code, className }: { code: string | null | undefined; className?: string }) {
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const size = cn("size-5 shrink-0", className);
  if (!code || failedCode === code) {
    return <Plane aria-hidden className={cn(size, "p-0.5 text-muted-foreground")} />;
  }
  return (
    // A 70px PNG from another host: next/image would only proxy it through this server.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(code)}.png`}
      alt=""
      aria-hidden
      loading="lazy"
      referrerPolicy="no-referrer"
      className={cn(size, "rounded-sm object-contain")}
      onError={() => setFailedCode(code)}
    />
  );
}
