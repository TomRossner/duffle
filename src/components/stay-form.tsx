"use client";

import { useCallback, useState } from "react";
import { BedDouble, Pencil } from "lucide-react";
import { ActionForm, InlineAction } from "@/components/action-form";
import { CostFields, Field, Select } from "@/components/fields";
import { PlaceLinks } from "@/components/place-links";
import { DateAndTime, StayEditor, type StayDraft } from "@/components/plan-form";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStay } from "@/lib/actions/schedule";

export function StayCard({
  tripId,
  stay,
  details,
  destinations,
  dates,
  remove,
}: {
  tripId: string;
  stay: StayDraft;
  details: { lat: number | null; lng: number | null };
  destinations: { id: string; name: string }[];
  dates: string;
  remove: () => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BedDouble className="size-4 shrink-0" />
          {stay.name}
        </CardTitle>
        <CardDescription>
          {dates}
          {stay.confirmation ? ` · ${stay.confirmation}` : ""}
        </CardDescription>
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
      <CardContent className="grid gap-2 text-sm">
        {editing ? (
          <StayEditor tripId={tripId} stay={stay} destinations={destinations} onSaved={close} />
        ) : (
          <>
            {stay.address ? <p>{stay.address}</p> : null}
            <PlaceLinks place={{ name: stay.name, address: stay.address, lat: details.lat, lng: details.lng }} />
            {stay.notes ? <p className="text-muted-foreground">{stay.notes}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StayFormToggle({
  tripId,
  destinations,
  currency,
}: {
  tripId: string;
  destinations: { id: string; name: string }[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <Button type="button" className="w-full sm:w-fit" onClick={() => setOpen(true)}>
        <BedDouble />
        Add a stay
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BedDouble className="size-5" />
          Add a stay
        </CardTitle>
        <CardDescription>Hotels and other places you will sleep. Check-in and check-out also show on the schedule.</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Close
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionForm action={createStay.bind(null, tripId)} submitLabel="Add stay" onSaved={close}>
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Address">
            <Input name="address" />
          </Field>
          <Field label="Destination">
            <Select name="destinationId" defaultValue="">
              <option value="">None</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <DateAndTime name="checkIn" dateLabel="Check in" timeLabel="Time" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateAndTime name="checkOut" dateLabel="Check out" timeLabel="Time" required />
            </div>
          </div>
          <Field label="Confirmation">
            <Input name="confirmation" />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
          <CostFields currency={currency} />
        </ActionForm>
      </CardContent>
    </Card>
  );
}
