"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { DeleteDialog } from "@/components/delete-dialog";
import { Field } from "@/components/fields";
import { PlaceSearch } from "@/components/place-search";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlaceLinks } from "@/components/place-links";
import { updateDestination } from "@/lib/actions/destinations";
import type { PlaceResult } from "@/lib/places";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

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
  const [error, setError] = useState<string | null>(null);

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
          </div>
        </div>
        <CardAction>
          <DestinationMenu name={destination.name} onEdit={() => setEditing(true)} remove={remove} onError={setError} />
        </CardAction>
        {error ? <p className="col-span-full text-sm text-destructive">{error}</p> : null}
        {/* Full-width row below the title so the actions column doesn't squeeze it on mobile. */}
        <PlaceLinks
          className="col-span-full mt-1 sm:pl-10"
          place={{
            name: destination.name,
            address: destination.address,
            placeId: destination.placeId,
            lat: destination.lat,
            lng: destination.lng,
          }}
        />
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

/** Compact destination entry for the trip overview, with the same edit/remove actions as the map page. */
export function DestinationRow({
  tripId,
  destination,
  dates,
  dateHint,
  remove,
}: {
  tripId: string;
  destination: DestinationDetails;
  dates: string;
  dateHint: string;
  remove: () => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="grid gap-1.5 rounded-lg bg-muted/60 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0">
          <span className="font-medium">{destination.name}</span>
          <span className="text-muted-foreground"> · {dates}</span>
        </p>
        <DestinationMenu name={destination.name} onEdit={() => setEditing(true)} remove={remove} onError={setError} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <PlaceLinks
        place={{
          name: destination.name,
          address: destination.address,
          placeId: destination.placeId,
          lat: destination.lat,
          lng: destination.lng,
        }}
      />
      {editing ? (
        <EditDestination tripId={tripId} destination={destination} dateHint={dateHint} onDone={close} />
      ) : null}
    </li>
  );
}

function DestinationMenu({
  name,
  onEdit,
  remove,
  onError,
}: {
  name: string;
  onEdit: () => void;
  remove: () => Promise<{ error?: string } | void>;
  onError: (error: string | null) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className={`${buttonVariants({ variant: "ghost", size: "icon-sm" })} shrink-0`}
          aria-label={`Actions for ${name}`}
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              <Menu.Item className={menuItemClass} onClick={onEdit}>
                <Pencil className="size-3.5" />
                Edit
              </Menu.Item>
              <Menu.Item
                className={`${menuItemClass} text-destructive`}
                disabled={removing}
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" />
                {removing ? "Removing..." : "Remove"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={`Are you sure you want to remove ${name} and its activities?`}
        confirmLabel="Remove"
        pending={removing}
        onConfirm={() => {
          setConfirming(false);
          setRemoving(true);
          onError(null);
          void remove().then((result) => {
            if (result && "error" in result && result.error) {
              onError(result.error);
              setRemoving(false);
            }
          });
        }}
      />
    </>
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
