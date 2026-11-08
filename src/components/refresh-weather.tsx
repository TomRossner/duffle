"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshWeather } from "@/lib/actions/weather";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const SAVED_MESSAGE_MS = 4000;

export function RefreshWeather({ tripId }: { tripId: string }) {
  const t = useT("weather");
  const [state, formAction, pending] = useActionState(async () => refreshWeather(tripId), null);
  // Each run returns a new state object; remember which one's message has timed out.
  const [expired, setExpired] = useState<typeof state>(null);
  const saved = state && "saved" in state ? (state.saved ?? 0) : 0;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setExpired(state), SAVED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [state, saved]);

  return (
    <form action={formAction} className="grid w-full gap-2 sm:w-auto sm:justify-items-end">
      <Button type="submit" size="lg" disabled={pending} className="w-full gap-2 px-4 sm:w-auto">
        <RefreshCw className={cn("size-4", pending && "animate-spin")} />
        {pending ? t("loading") : t("load")}
      </Button>
      {state?.error ? <p className="text-sm text-destructive sm:text-end">{state.error}</p> : null}
      {state?.notice ? (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground sm:text-end">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.notice}
        </p>
      ) : null}
      {saved > 0 && state !== expired && !pending ? (
        <p className="text-sm text-muted-foreground sm:text-end">{t("saved", { count: saved })}</p>
      ) : null}
    </form>
  );
}
