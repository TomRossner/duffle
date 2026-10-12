"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Pencil, Trash2, X } from "lucide-react";
import { cloneElement, isValidElement, useState } from "react";
import { cn } from "@/lib/utils";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { Field, FieldGroup } from "@/components/fields";
import { DateAndTime, KindTags } from "@/components/plan-form";
import { WeatherMark } from "@/components/weather-mark";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateActivity } from "@/lib/actions/destinations";
import { updateScheduleItem } from "@/lib/actions/schedule";
import { PLAN_KINDS, SCHEDULE_KINDS } from "@/lib/constants";

export type DayPlan = {
  id: string;
  title: string;
  kind: string;
  startAt: string;
  endAt: string;
  placeName: string;
  notes: string;
};

export type DayActivity = {
  id: string;
  title: string;
  notes: string;
  startAt: string;
  endAt: string;
};

const scheduleKinds = PLAN_KINDS.filter((kind) =>
  (SCHEDULE_KINDS as readonly string[]).includes(kind.id),
);

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

export function DaySection({
  dateLabel,
  condition,
  forecast,
  children,
}: {
  dateLabel: string;
  condition: string | null;
  forecast: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl ring-1 ring-foreground/10">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="font-medium">{dateLabel}</h2>
        {condition && forecast ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <WeatherMark condition={condition} />
            {forecast}
          </p>
        ) : null}
      </header>
      <div className="grid gap-2 px-4 py-3">{children}</div>
    </section>
  );
}

export function ScheduleItemMenu({
  label,
  confirmMessage,
  remove,
  children,
}: {
  label: string;
  confirmMessage: string;
  remove: () => Promise<{ error?: string } | void>;
  children: React.ReactElement<{ onSaved?: () => void }>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editor = isValidElement(children) ? cloneElement(children, { onSaved: () => setEditing(false) }) : children;

  return (
    <div
      className="shrink-0 in-data-[layout=calendar]:absolute in-data-[layout=calendar]:top-1/2 in-data-[layout=calendar]:right-0.5 in-data-[layout=calendar]:-translate-y-1/2 in-data-[layout=calendar]:bg-muted"
      onClick={(event) => event.stopPropagation()}
    >
      <Menu.Root>
        <Menu.Trigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "in-data-[layout=calendar]:size-6")}
          aria-label={`Actions for ${label}`}
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
              <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                <Trash2 className="size-3.5" />
                Remove
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      {editing ? (
        <Dialog.Root open onOpenChange={setEditing}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
              <Dialog.Popup className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <Dialog.Title className="text-lg font-medium">Edit {label}</Dialog.Title>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                {editor}
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={confirmMessage}
        confirmLabel="Remove"
        onConfirm={() => {
          setConfirming(false);
          setError(null);
          void remove().then((result) => {
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
      />
    </div>
  );
}

export function PlanEditor({
  tripId,
  plan,
  onSaved,
}: {
  tripId: string;
  plan: DayPlan;
  onSaved?: () => void;
}) {
  return (
    <ActionForm
      action={updateScheduleItem.bind(null, tripId, plan.id)}
      submitLabel="Save"
      onSaved={onSaved}
      className="grid gap-3"
    >
      <PlanFields defaults={plan} />
    </ActionForm>
  );
}

export function ActivityEditor({
  tripId,
  activity,
  onSaved,
}: {
  tripId: string;
  activity: DayActivity;
  onSaved?: () => void;
}) {
  return (
    <ActionForm
      action={updateActivity.bind(null, tripId, activity.id)}
      submitLabel="Save"
      onSaved={onSaved}
      className="grid gap-3"
    >
      <Field label="Activity">
        <Input name="title" defaultValue={activity.title} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <DateAndTime name="startAt" dateLabel="Starts" timeLabel="Time" defaultValue={activity.startAt} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DateAndTime name="endAt" dateLabel="Ends" timeLabel="Time" defaultValue={activity.endAt} />
        </div>
      </div>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={activity.notes} />
      </Field>
    </ActionForm>
  );
}

function PlanFields({
  defaults,
}: {
  defaults: { title: string; kind: string; startAt: string; endAt: string; placeName: string; notes: string };
}) {
  const [kind, setKind] = useState(defaults.kind);
  return (
    <>
      <Field label="Title">
        <Input name="title" defaultValue={defaults.title} required />
      </Field>
      <FieldGroup label="Kind">
        <KindTags value={kind} onValueChange={setKind} kinds={scheduleKinds} />
      </FieldGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <DateAndTime name="startAt" dateLabel="Starts" timeLabel="Time" defaultValue={defaults.startAt} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DateAndTime name="endAt" dateLabel="Ends" timeLabel="Time" defaultValue={defaults.endAt} />
        </div>
      </div>
      <Field label="Place">
        <Input name="placeName" defaultValue={defaults.placeName} />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={defaults.notes} />
      </Field>
    </>
  );
}
