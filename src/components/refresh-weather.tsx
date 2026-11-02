"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshWeather } from "@/lib/actions/weather";
import { cn } from "@/lib/utils";

export function RefreshWeather({ tripId }: { tripId: string }) {
  const [state, formAction, pending] = useActionState(async () => refreshWeather(tripId), null);

  return (
    <form action={formAction} className="grid w-full gap-2 sm:w-auto sm:justify-items-end">
      <Button type="submit" size="lg" disabled={pending} className="w-full gap-2 px-4 sm:w-auto">
        <RefreshCw className={cn("size-4", pending && "animate-spin")} />
        {pending ? "Loading forecast..." : "Load forecast"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive sm:text-right">{state.error}</p> : null}
      {state && "saved" in state && state.saved ? (
        <p className="text-sm text-muted-foreground sm:text-right">Saved {state.saved} days.</p>
      ) : null}
    </form>
  );
}
