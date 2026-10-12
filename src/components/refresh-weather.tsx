"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { refreshWeather } from "@/lib/actions/weather";

export function RefreshWeather({ tripId }: { tripId: string }) {
  const [state, formAction, pending] = useActionState(async () => refreshWeather(tripId), null);

  return (
    <form action={formAction} className="grid gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Loading forecast..." : "Load forecast"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "saved" in state && state.saved ? (
        <p className="text-sm text-muted-foreground">Saved {state.saved} days.</p>
      ) : null}
    </form>
  );
}
