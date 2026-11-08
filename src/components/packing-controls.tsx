"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generatePacking, setPackingStatus } from "@/lib/actions/packing";

export function SuggestPackingButton({ tripId }: { tripId: string }) {
  const [state, formAction, pending] = useActionState(async () => generatePacking(tripId), null);

  return (
    <form action={formAction} className="grid gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Suggesting..." : "Suggest what to bring"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && "ok" in state && state.ok ? (
        <p className="text-sm text-muted-foreground">Updated {state.count} day suggestions.</p>
      ) : null}
    </form>
  );
}

export function PackingStatusButtons({ tripId, itemId }: { tripId: string; itemId: string }) {
  return (
    <div className="flex gap-2">
      <StatusButton tripId={tripId} itemId={itemId} status="PACKED" label="Pack" />
      <StatusButton tripId={tripId} itemId={itemId} status="SKIPPED" label="Skip" />
      <StatusButton tripId={tripId} itemId={itemId} status="SUGGESTED" label="Reset" />
    </div>
  );
}

function StatusButton({
  tripId,
  itemId,
  status,
  label,
}: {
  tripId: string;
  itemId: string;
  status: "PACKED" | "SKIPPED" | "SUGGESTED";
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => setPackingStatus(tripId, itemId, status),
    null,
  );

  return (
    <form action={formAction}>
      <Button type="submit" size="sm" variant={status === "PACKED" ? "default" : "outline"} disabled={pending}>
        {label}
      </Button>
      {state?.error ? <span className="ms-2 text-xs text-destructive">{state.error}</span> : null}
    </form>
  );
}
