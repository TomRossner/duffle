"use client";

import { Menu } from "@base-ui/react/menu";
import { useCallback, useState } from "react";
import { BedDouble, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { CostFields, Field, Select } from "@/components/fields";
import { PlaceLinks } from "@/components/place-links";
import { DateAndTime, StayEditor, type StayDraft } from "@/components/plan-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStay } from "@/lib/actions/schedule";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

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
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <Menu.Root>
            <Menu.Trigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Actions for ${stay.name}`}
            >
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
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
            message={`Are you sure you want to remove ${stay.name}?`}
            confirmLabel="Remove"
            pending={removing}
            onConfirm={() => {
              setConfirming(false);
              setRemoving(true);
              setError(null);
              void remove().then((result) => {
                if (result && "error" in result && result.error) {
                  setError(result.error);
                  setRemoving(false);
                }
              });
            }}
          />
        </CardAction>
        {error ? <p className="col-span-full text-sm text-destructive">{error}</p> : null}
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {editing ? (
          <>
            <StayEditor tripId={tripId} stay={stay} destinations={destinations} onSaved={close} />
            <Button type="button" variant="outline" className="w-full sm:w-fit" onClick={close}>
              Cancel
            </Button>
          </>
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
