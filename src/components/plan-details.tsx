"use client";

import {
  CalendarClock,
  Clock,
  MapPin,
  Moon,
  Navigation,
  Repeat,
  StickyNote,
  Tag,
  Ticket,
  Wallet,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { KindIcon } from "@/components/kind-icon";
import { PlaceLinks } from "@/components/place-links";
import { PLAN_COLORS, planIconColor, type PLAN_KINDS } from "@/lib/constants";
import { dateKey, formatDateLong, formatDateShort, formatTime } from "@/lib/dates";
import { formatMinutes } from "@/lib/flight-lookup";
import type { PlaceTarget } from "@/lib/place-links";
import { ACTIVITY_COLORS, ActivityTagLabel, isActivityTag } from "@/lib/tag-meta";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The coloured tile with a plan kind's icon, for a dialog header. */
export function PlanIconTile({ kind, className }: { kind: string; className?: string }) {
  const color = kind in PLAN_COLORS ? PLAN_COLORS[kind as (typeof PLAN_KINDS)[number]["id"]] : "bg-muted text-foreground";
  return (
    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", color, className)}>
      <KindIcon kind={kind} className={cn("size-5", planIconColor(kind))} />
    </span>
  );
}

/** A labelled list of details; pass DetailRow children. */
export function DetailList({ children }: { children: React.ReactNode }) {
  return <dl className="grid divide-y rounded-xl px-4 ring-1 ring-foreground/10">{children}</dl>;
}

export function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="min-w-0 text-sm break-words">{children}</dd>
      </div>
    </div>
  );
}

export function ConfirmationRow({ code }: { code: string | null }) {
  return (
    <DetailRow icon={Ticket} label="Confirmation">
      {code ? (
        <span className="-my-1 flex items-center gap-1">
          <span className="font-mono text-base font-medium tracking-wider">{code}</span>
          <CopyButton value={code} label="Copy confirmation code" />
        </span>
      ) : (
        <span className="text-muted-foreground">Not added</span>
      )}
    </DetailRow>
  );
}

export function NotesRow({ notes }: { notes: string | null }) {
  if (!notes) return null;
  return (
    <DetailRow icon={StickyNote} label="Notes">
      <span className="whitespace-pre-wrap">{notes}</span>
    </DetailRow>
  );
}

export function DirectionsSection({ title = "Getting there", places }: { title?: string; places: { label?: string; place: PlaceTarget }[] }) {
  if (places.length === 0) return null;
  return (
    <section className="grid gap-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      <div className="grid gap-2">
        {places.map(({ label, place }, index) => (
          <PlaceLinks key={index} label={label} place={place} />
        ))}
      </div>
    </section>
  );
}

function TimeBlock({ label, date, align }: { label: string; date: Date; align: "start" | "end" }) {
  return (
    <div className={cn("grid min-w-0 gap-1", align === "end" ? "justify-items-end text-right" : "justify-items-start")}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-3xl font-semibold tabular-nums sm:text-4xl">{formatTime(date)}</p>
      <p className="text-xs text-muted-foreground">{formatDateShort(date)}</p>
    </div>
  );
}

/**
 * The "when" panel at the top of a plan's dialog: start and end with the length between them, a single
 * start time, or an all-day day.
 */
export function WhenPanel({
  start,
  end,
  allDay = false,
  startLabel = "Starts",
  endLabel = "Ends",
  span,
  icon: Icon = Clock,
  footnote,
}: {
  start: Date;
  end?: Date | null;
  allDay?: boolean;
  startLabel?: string;
  endLabel?: string;
  /** Text between the two times. Defaults to the time between them. */
  span?: string;
  icon?: React.ComponentType<{ className?: string }>;
  footnote?: React.ReactNode;
}) {
  const body = allDay ? (
    <div className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-foreground/10">
        <CalendarClock className="size-5 text-primary" />
      </span>
      <div className="grid gap-0.5">
        <p className="text-2xl font-semibold">All day</p>
        <p className="text-sm text-muted-foreground">{formatDateLong(start)}</p>
      </div>
    </div>
  ) : end && end.getTime() > start.getTime() ? (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
      <TimeBlock label={startLabel} date={start} align="start" />
      <div className="flex w-16 flex-col items-center gap-1.5 pt-7 sm:w-28" aria-hidden>
        <div className="flex w-full items-center gap-1 text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-current" />
          <span className="h-px flex-1 border-t border-dashed border-current" />
          <Icon className="size-4 shrink-0 text-primary" />
          <span className="h-px flex-1 border-t border-dashed border-current" />
          <span className="size-1.5 shrink-0 rounded-full bg-current" />
        </div>
        <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
          {span ?? formatMinutes((end.getTime() - start.getTime()) / 60000)}
        </span>
      </div>
      <TimeBlock label={endLabel} date={end} align="end" />
    </div>
  ) : (
    <TimeBlock label={startLabel} date={start} align="start" />
  );

  return (
    <section className="rounded-xl bg-muted/60 p-4 ring-1 ring-foreground/10 sm:p-5">
      {body}
      {footnote ? (
        <p className="mt-4 border-t border-dashed border-foreground/15 pt-3 text-xs text-muted-foreground">{footnote}</p>
      ) : null}
    </section>
  );
}

function nightsBetween(checkIn: Date, checkOut: Date) {
  const from = Date.parse(`${dateKey(checkIn)}T00:00:00Z`);
  const to = Date.parse(`${dateKey(checkOut)}T00:00:00Z`);
  return Math.max(0, Math.round((to - from) / DAY_MS));
}

export type StayDetailsData = {
  name: string;
  address: string | null;
  destination: string | null;
  lat: number | null;
  lng: number | null;
  checkIn: Date;
  checkOut: Date;
  confirmation: string | null;
  notes: string | null;
  cost: string | null;
};

export function StayDetails({ stay }: { stay: StayDetailsData }) {
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const hasPlace = Boolean(stay.address) || (stay.lat != null && stay.lng != null);

  return (
    <div className="grid gap-5">
      <WhenPanel
        start={stay.checkIn}
        end={stay.checkOut}
        startLabel="Check in"
        endLabel="Check out"
        icon={Moon}
        span={nights === 0 ? "Same day" : `${nights} ${nights === 1 ? "night" : "nights"}`}
      />
      <DetailList>
        <DetailRow icon={MapPin} label="Address">
          {stay.address ?? <span className="text-muted-foreground">Not added</span>}
        </DetailRow>
        {stay.destination ? (
          <DetailRow icon={Navigation} label="Destination">
            {stay.destination}
          </DetailRow>
        ) : null}
        <ConfirmationRow code={stay.confirmation} />
        {stay.cost ? (
          <DetailRow icon={Wallet} label="Cost">
            {stay.cost}
            {nights > 1 ? <span className="text-muted-foreground"> for {nights} nights</span> : null}
          </DetailRow>
        ) : null}
        <NotesRow notes={stay.notes} />
      </DetailList>
      {hasPlace ? (
        <DirectionsSection
          places={[{ place: { name: stay.name, address: stay.address, lat: stay.lat, lng: stay.lng } }]}
        />
      ) : null}
    </div>
  );
}

export type PlanDetailsData = {
  start: Date;
  end: Date | null;
  allDay: boolean;
  /** Where it happens, as typed in the plan. */
  placeName: string | null;
  /** The trip destination it belongs to (activities). */
  destination: string | null;
  tags: string[];
  /** The other days a repeating plan is on (YYYY-MM-DD). */
  seriesDays: string[];
  cost: string | null;
  notes: string | null;
  place: PlaceTarget | null;
};

function seriesText(days: string[]) {
  const dates = [...days].sort().map((day) => formatDateShort(new Date(`${day}T00:00:00Z`)));
  if (dates.length <= 4) return dates.join(", ");
  return `${dates.slice(0, 3).join(", ")} and ${dates.length - 3} more`;
}

/** Details for a schedule plan (dinner, transport, meetup, other) or a destination activity. */
export function PlanDetails({ plan }: { plan: PlanDetailsData }) {
  const tags = plan.tags.filter(isActivityTag);

  return (
    <div className="grid gap-5">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Tags">
          {tags.map((tag) => (
            <span key={tag} className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm", ACTIVITY_COLORS[tag])}>
              <ActivityTagLabel tag={tag} iconClassName="size-4" />
            </span>
          ))}
        </div>
      ) : null}
      <WhenPanel start={plan.start} end={plan.end} allDay={plan.allDay} />
      <DetailList>
        {plan.placeName ? (
          <DetailRow icon={MapPin} label="Place">
            {plan.placeName}
          </DetailRow>
        ) : null}
        {plan.destination ? (
          <DetailRow icon={Navigation} label="Destination">
            {plan.destination}
          </DetailRow>
        ) : null}
        {plan.seriesDays.length > 0 ? (
          <DetailRow icon={Repeat} label={`Repeats on ${plan.seriesDays.length} more ${plan.seriesDays.length === 1 ? "day" : "days"}`}>
            {seriesText(plan.seriesDays)}
          </DetailRow>
        ) : null}
        {plan.cost ? (
          <DetailRow icon={Wallet} label="Cost">
            {plan.cost}
          </DetailRow>
        ) : null}
        <NotesRow notes={plan.notes} />
        {!plan.placeName && !plan.destination && plan.seriesDays.length === 0 && !plan.cost && !plan.notes ? (
          <DetailRow icon={Tag} label="Details">
            <span className="text-muted-foreground">Nothing else added yet. Use Edit to add a place or notes.</span>
          </DetailRow>
        ) : null}
      </DetailList>
      {plan.place ? <DirectionsSection places={[{ place: plan.place }]} /> : null}
    </div>
  );
}
