"use client";

import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { BedDouble, Clock, EllipsisVertical, MapPin, Moon, Pencil, StickyNote, Trash2 } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { DeleteDialog } from "@/components/delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { CostFields, Field, Select } from "@/components/fields";
import { DirectionsButton } from "@/components/place-links";
import { DateAndTime, StayEditor, type StayDraft } from "@/components/plan-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStay } from "@/lib/actions/schedule";
import { PLAN_COLORS, PLAN_ICON_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const monthDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-11-14T15:00" (local wall-clock time) as its parts, read in UTC like the rest of the app. */
function parts(value: string) {
  const date = new Date(`${value}:00Z`);
  return { weekday: weekday.format(date), date: monthDay.format(date), time: value.slice(11, 16) };
}

function nightsBetween(checkIn: string, checkOut: string) {
  const from = Date.parse(`${checkIn.slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${checkOut.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function nightsLabel(nights: number) {
  return nights === 0 ? "Same day" : `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function Moment({ label, value, align }: { label: string; value: string; align: "start" | "end" }) {
  const { weekday, date, time } = parts(value);
  return (
    <div className={cn("grid min-w-0 gap-0.5", align === "end" && "justify-items-end text-right")}>
      <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-base font-semibold">
        {weekday}, {date}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <Clock className="size-3" />
        {time}
      </span>
    </div>
  );
}

export type StayStatus = "upcoming" | "current" | "past";

export function StayCard({
  tripId,
  stay,
  details,
  destinations,
  remove,
}: {
  tripId: string;
  stay: StayDraft;
  details: {
    lat: number | null;
    lng: number | null;
    /** The linked expense, formatted ("€640.00"). */
    cost: string | null;
    status: StayStatus;
  };
  destinations: { id: string; name: string }[];
  remove: () => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const destination = destinations.find((option) => option.id === stay.destinationId)?.name;

  return (
    <Card className={cn("gap-0 py-0 pb-4", details.status === "current" && "ring-2 ring-primary/50")}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", PLAN_COLORS.STAY)}>
          <BedDouble className={cn("size-5", PLAN_ICON_COLORS.STAY)} />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 truncate text-base font-semibold">{stay.name}</h2>
            {details.status === "current" ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Staying now
              </span>
            ) : details.status === "past" ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Past</span>
            ) : null}
          </div>
          {stay.address || destination ? (
            <p className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0">
                {stay.address}
                {stay.address && destination ? " · " : ""}
                {destination ? <span className="font-medium text-foreground">{destination}</span> : null}
              </span>
            </p>
          ) : null}
        </div>
        <DirectionsButton
          places={[{ place: { name: stay.name, address: stay.address, lat: details.lat, lng: details.lng } }]}
        />
        <Menu.Root>
          <Menu.Trigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "-mr-1 shrink-0")}
            aria-label={`Actions for ${stay.name}`}
          >
            <EllipsisVertical />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
              <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
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
      </div>

      <div className="mx-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-muted/60 px-3 py-3 ring-1 ring-foreground/5">
        <Moment label="Check in" value={stay.checkIn} align="start" />
        <div className="flex w-16 flex-col items-center gap-1 sm:w-24">
          <div className="flex w-full items-center gap-1 text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 border-t border-dashed border-current" />
            <Moon className="size-3.5 shrink-0 text-primary" />
            <span className="h-px flex-1 border-t border-dashed border-current" />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">{nightsLabel(nights)}</span>
        </div>
        <Moment label="Check out" value={stay.checkOut} align="end" />
      </div>

      {stay.confirmation || details.cost ? (
        <dl className="mx-4 mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {stay.confirmation ? (
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Confirmation</dt>
              <dd className="-my-1 flex items-center gap-0.5">
                <span className="font-mono font-medium tracking-wider">{stay.confirmation}</span>
                <CopyButton value={stay.confirmation} label="Copy confirmation code" />
              </dd>
            </div>
          ) : null}
          {details.cost ? (
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Cost</dt>
              <dd className="font-medium">
                {details.cost}
                {nights > 1 ? <span className="font-normal text-muted-foreground"> · {nights} nights</span> : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {stay.notes ? (
        <p className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          <StickyNote className="mt-0.5 size-3.5 shrink-0" />
          <span className="whitespace-pre-wrap">{stay.notes}</span>
        </p>
      ) : null}

      {error ? <p className="mx-4 mt-3 text-sm text-destructive">{error}</p> : null}


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
      <FormDialog title={`Edit ${stay.name}`} icon={<BedDouble />} open={editing} onOpenChange={setEditing} wide>
        <StayEditor tripId={tripId} stay={stay} destinations={destinations} />
      </FormDialog>
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
  return (
    <FormDialog
      title="Add a stay"
      description="Hotels and other places you will sleep. Check-in and check-out also show on the schedule."
      icon={<BedDouble />}
      triggerClassName="w-full sm:w-fit"
      wide
    >
        <ActionForm action={createStay.bind(null, tripId)} submitLabel="Add stay">
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
    </FormDialog>
  );
}
