"use client";

import { useActionState, useEffect, useState } from "react";
import { PlaceSearch } from "@/components/place-search";
import { Field } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDestination } from "@/lib/actions/destinations";
import type { PlaceResult } from "@/lib/places";

export function DestinationForm({
  tripId,
  startDate,
  endDate,
  dateHint,
}: {
  tripId: string;
  startDate: string;
  endDate: string;
  dateHint: string;
}) {
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [manual, setManual] = useState(false);
  const [rename, setRename] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(createDestination.bind(null, tripId), null);
  const usingPlace = place !== null && !manual;

  useEffect(() => {
    if (!state?.ok) return;
    setPlace(null);
    setManual(false);
    setRename(false);
    setFormKey((key) => key + 1);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3">
      <div key={formKey} className="grid gap-3">
      <div className="grid gap-1.5">
        <span className="text-sm leading-none font-medium">Place</span>
        <PlaceSearch
          onPick={(picked) => {
            setPlace(picked);
            setManual(false);
            setRename(false);
          }}
        />
      </div>

      {usingPlace ? (
        <div className="grid gap-2 rounded-lg bg-muted px-3 py-2.5">
          <div>
            <p className="font-medium">{place.name}</p>
            {place.address && place.address !== place.name ? (
              <p className="text-sm text-muted-foreground">{place.address}</p>
            ) : null}
          </div>
          <input type="hidden" name="placeId" value={place.placeId} />
          <input type="hidden" name="address" value={place.address} />
          <input type="hidden" name="lat" value={String(place.lat)} />
          <input type="hidden" name="lng" value={String(place.lng)} />
          {rename ? (
            <Field label="Name">
              <Input name="name" defaultValue={place.name} required />
            </Field>
          ) : (
            <input type="hidden" name="name" value={place.name} />
          )}
          <div className="flex gap-2">
            {rename ? null : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setRename(true)}>
                Rename
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlace(null);
                setRename(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : manual ? (
        <>
          <Field label="Name">
            <Input name="name" defaultValue={place?.name ?? ""} required />
          </Field>
          <Field label="Address">
            <Input name="address" defaultValue={place?.address ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <Input name="lat" defaultValue={place ? String(place.lat) : ""} required />
            </Field>
            <Field label="Longitude">
              <Input name="lng" defaultValue={place ? String(place.lng) : ""} required />
            </Field>
          </div>
          {place ? (
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setManual(false)}>
              Use {place.name}
            </Button>
          ) : null}
        </>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Search, then choose a result. That sets the pin.</p>
          <Button type="button" variant="outline" className="justify-self-start" onClick={() => setManual(true)}>
            Enter a location yourself
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First day">
          <Input name="startDate" type="date" defaultValue={startDate} required />
        </Field>
        <Field label="Last day">
          <Input name="endDate" type="date" defaultValue={endDate} required />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{dateHint}</p>
      <Field label="Note">
        <Textarea name="notes" rows={2} placeholder="Optional" />
      </Field>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add destination"}
      </Button>
    </form>
  );
}
