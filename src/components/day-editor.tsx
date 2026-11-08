"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { CalendarCheck, EllipsisVertical, Pencil, Trash2, X } from "lucide-react";
import { cloneElement, isValidElement, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { CheckList, Field, FieldGroup } from "@/components/fields";
import { KindTags } from "@/components/plan-form";
import { ScheduleWhenFields } from "@/components/schedule-when-fields";
import { WeatherMark } from "@/components/weather-mark";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateActivity } from "@/lib/actions/destinations";
import { updateScheduleItem } from "@/lib/actions/schedule";
import { ACTIVITY_TAGS, PLAN_KINDS, SCHEDULE_KINDS } from "@/lib/constants";
import { ACTIVITY_COLORS, ActivityTagLabel } from "@/lib/tag-meta";

export type DayPlan = {
  id: string;
  title: string;
  kind: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  /** Other days of its series (YYYY-MM-DD). */
  seriesDays: string[];
  placeName: string;
  notes: string;
};

export type DayActivity = {
  id: string;
  title: string;
  notes: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  /** Other days of its series (YYYY-MM-DD). */
  seriesDays: string[];
  /** When given, the editor shows the tag picker and saves the chosen tags. */
  tags?: string[];
};

const scheduleKinds = PLAN_KINDS.filter((kind) =>
  (SCHEDULE_KINDS as readonly string[]).includes(kind.id),
);

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

export function DaySection({
  dateLabel,
  condition,
  forecast,
  today = false,
  children,
}: {
  dateLabel: string;
  condition: string | null;
  forecast: string | null;
  today?: boolean;
  children: React.ReactNode;
}) {
  const t = useT("schedule");
  return (
    <section
      data-today={today || undefined}
      aria-current={today ? "date" : undefined}
      className={cn(
        "scroll-mt-4 rounded-xl ring-1 ring-foreground/10",
        today && "bg-primary/[0.03] shadow-md shadow-primary/10 ring-2 ring-primary",
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3",
          today && "rounded-t-xl border-primary/20 bg-primary/10",
        )}
      >
        <h2 className={cn("flex items-center gap-2 font-medium", today && "font-semibold text-primary")}>
          {today ? <CalendarCheck className="size-4 shrink-0" aria-hidden /> : null}
          {dateLabel}
          {today ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{t("board.today")}</span>
          ) : null}
        </h2>
        {condition && forecast ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <WeatherMark condition={condition} />
            {forecast}
          </p>
        ) : null}
      </header>
      {/* Extra top room on today, for the "Now" and "Up next" labels that sit on a card's top edge. */}
      <div className={cn("grid gap-2 px-4 py-3", today && "pt-4")}>{children}</div>
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
  const t = useT("schedule");
  const tCommon = useT("common");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editor = isValidElement(children) ? cloneElement(children, { onSaved: () => setEditing(false) }) : children;

  return (
    <div
      className="shrink-0 in-data-[layout=calendar]:absolute in-data-[layout=calendar]:top-1/2 in-data-[layout=calendar]:end-0.5 in-data-[layout=calendar]:-translate-y-1/2 in-data-[layout=calendar]:bg-muted"
      onClick={(event) => event.stopPropagation()}
    >
      <Menu.Root>
        <Menu.Trigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "in-data-[layout=calendar]:size-6")}
          aria-label={tCommon("actionsFor", { name: label })}
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
                {tCommon("edit")}
              </Menu.Item>
              <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                <Trash2 className="size-3.5" />
                {tCommon("remove")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-medium">{t("board.editTitle", { name: label })}</Dialog.Title>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              {editor}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={confirmMessage}
        confirmLabel={tCommon("remove")}
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
  tripDays,
  onSaved,
}: {
  tripId: string;
  plan: DayPlan;
  tripDays: string[];
  onSaved?: () => void;
}) {
  const tCommon = useT("common");
  return (
    <ActionForm
      action={updateScheduleItem.bind(null, tripId, plan.id)}
      submitLabel={tCommon("save")}
      onSaved={onSaved}
      className="grid gap-3"
    >
      <PlanFields defaults={plan} tripDays={tripDays} />
    </ActionForm>
  );
}

export function ActivityEditor({
  tripId,
  activity,
  tripDays,
  onSaved,
}: {
  tripId: string;
  activity: DayActivity;
  tripDays: string[];
  onSaved?: () => void;
}) {
  const t = useT("schedule");
  const tCommon = useT("common");
  return (
    <ActionForm
      action={updateActivity.bind(null, tripId, activity.id)}
      submitLabel={tCommon("save")}
      onSaved={onSaved}
      className="grid gap-3"
    >
      <Field label={t("form.activity")}>
        <Input name="title" defaultValue={activity.title} required />
      </Field>
      <ScheduleWhenFields
        tripDays={tripDays}
        defaultStart={activity.startAt}
        defaultEnd={activity.endAt}
        defaultAllDay={activity.allDay}
        defaultRepeat={activity.seriesDays}
        editing
      />
      {activity.tags ? (
        <FieldGroup label={t("form.tags")}>
          <input type="hidden" name="editTags" value="on" />
          <CheckList
            name="tags"
            defaultChecked={false}
            checkedIds={activity.tags}
            options={ACTIVITY_TAGS.map((tag) => ({
              id: tag,
              color: ACTIVITY_COLORS[tag],
              label: <ActivityTagLabel tag={tag} />,
            }))}
          />
        </FieldGroup>
      ) : null}
      <Field label={t("form.notes")}>
        <Textarea name="notes" rows={2} defaultValue={activity.notes} />
      </Field>
    </ActionForm>
  );
}

function PlanFields({
  defaults,
  tripDays,
}: {
  defaults: DayPlan;
  tripDays: string[];
}) {
  const t = useT("schedule");
  const [kind, setKind] = useState(defaults.kind);
  return (
    <>
      <Field label={t("form.title")}>
        <Input name="title" defaultValue={defaults.title} required />
      </Field>
      <FieldGroup label={t("form.kind")}>
        <KindTags value={kind} onValueChange={setKind} kinds={scheduleKinds} />
      </FieldGroup>
      <ScheduleWhenFields
        tripDays={tripDays}
        defaultStart={defaults.startAt}
        defaultEnd={defaults.endAt}
        defaultAllDay={defaults.allDay}
        defaultRepeat={defaults.seriesDays}
        required
        editing
      />
      <Field label={t("form.place")}>
        <Input name="placeName" defaultValue={defaults.placeName} />
      </Field>
      <Field label={t("form.notes")}>
        <Textarea name="notes" rows={2} defaultValue={defaults.notes} />
      </Field>
    </>
  );
}
