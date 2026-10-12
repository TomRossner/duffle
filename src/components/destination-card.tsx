"use client";

import { Pencil } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { InlineAction } from "@/components/action-form";
import { Field } from "@/components/fields";
import { PlaceSearch } from "@/components/place-search";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlaceLinks } from "@/components/place-links";
import { updateDestination } from "@/lib/actions/destinations";
import type { PlaceResult } from "@/lib/places";

type DestinationDetails = {
  id: string;
  name: string;
  address: string | null;
  placeId: string | null;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  notes: string | null;
};

export function DestinationCard({
  tripId,
  index,
  destination,
  dates,
  dateHint,
  note,
  remove,
  children,
}: {
  tripId: string;
  index: number;
  destination: DestinationDetails;
  dates: string;
  dateHint: string;
  note: string | null;
  remove: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="inline-grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {index + 1}
          </span>
          <div className="min-w-0">
            <CardTitle>{destination.name}</CardTitle>
            {destination.address && destination.address !== destination.name ? (
              <CardDescription>{destination.address}</CardDescription>
            ) : null}
            <p className="mt-1 text-sm">{dates}</p>
            <PlaceLinks
              className="mt-2"
              place={{
                name: destination.name,
                address: destination.address,
                placeId: destination.placeId,
                lat: destination.lat,
                lng: destination.lng,
              }}
            />
          </div>
        </div>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing((open) => !open)}>
              {editing ? (
                "Close"
              ) : (
                <>
                  <Pencil />
                  Edit
                </>
              )}
            </Button>
            <InlineAction action={remove} label="Remove" variant="destructive" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {editing ? (
          <EditDestination tripId={tripId} destination={destination} dateHint={dateHint} onDone={close} />
        ) : note ? (
          <p className="text-sm text-muted-foreground">{note}</p>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

function EditDestination({
  tripId,
  destination,
  dateHint,
  onDone,
}: {
  tripId: string;
  destination: DestinationDetails;
  dateHint: string;
  onDone: () => void;
}) {
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [state, formAction, pending] = useActionState(updateDestination.bind(null, tripId, destination.id), null);
  const address = place ? place.address : (destination.address ?? "");
  const placeLabel = place?.name ?? destination.name;
  const placeDetail = place?.address || destination.address;

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl bg-muted/60 p-3">
      <div className="grid gap-1.5">
        <span className="text-sm leading-none font-medium">Place</span>
        <PlaceSearch onPick={setPlace} />
      </div>
      <p className="text-sm text-muted-foreground">
        {placeLabel}
        {placeDetail && placeDetail !== placeLabel ? ` · ${placeDetail}` : ""}
      </p>
      <input type="hidden" name="lat" value={String(place?.lat ?? destination.lat)} />
      <input type="hidden" name="lng" value={String(place?.lng ?? destination.lng)} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="placeId" value={place?.placeId ?? destination.placeId ?? ""} />
      <Field label="Name">
        <Input name="name" key={place?.placeId ?? destination.id} defaultValue={place?.name ?? destination.name} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First day">
          <Input name="startDate" type="date" defaultValue={destination.startDate} required />
        </Field>
        <Field label="Last day">
          <Input name="endDate" type="date" defaultValue={destination.endDate} required />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{dateHint}</p>
      <Field label="Note">
        <Textarea name="notes" rows={2} defaultValue={destination.notes ?? ""} placeholder="Optional" />
      </Field>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
