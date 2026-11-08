"use client";

import { LoaderCircle, Pencil, Plane, Plus, Search } from "lucide-react";
import { Fragment, useState, useTransition } from "react";
import { ActionForm } from "@/components/action-form";
import { FormDialog } from "@/components/form-dialog";
import { AirlineLogo } from "@/components/airline-logo";
import { Button } from "@/components/ui/button";
import { CheckList, CostFields, Field, FieldGroup, Select } from "@/components/fields";
import { AirlineInput, AirportInput, AirportLabel } from "@/components/flight-autocomplete";
import { KindIcon } from "@/components/kind-icon";
import { ScheduleWhenFields } from "@/components/schedule-when-fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlan, lookupFlight, updateFlight, updateStay } from "@/lib/actions/schedule";
import { PLAN_COLORS, PLAN_KINDS, planIconColor } from "@/lib/constants";
import {
  airlineCodeOf,
  dayOffset,
  formatMinutes,
  journeyRoute,
  minutesBetween,
  terminalLabel,
  type FlightJourney,
  type FlightMatch,
} from "@/lib/flight-lookup";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type PlanKindId = (typeof PLAN_KINDS)[number]["id"];

export type PersonOption = { id: string; label: React.ReactNode };

export type FlightDraft = {
  id: string;
  airline: string;
  flightNumber: string;
  fromAirport: string;
  fromTerminal: string;
  toAirport: string;
  toTerminal: string;
  durationMinutes: number | null;
  departAt: string;
  arriveAt: string;
  confirmation: string;
  seats: string;
  notes: string;
  travelerIds: string[];
};

export function PlanTag({ kind }: { kind: string }) {
  const tLabels = useT("labels");
  const color = kind in PLAN_COLORS ? PLAN_COLORS[kind as PlanKindId] : "bg-muted text-foreground";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:px-1 in-data-[layout=calendar]:py-0.5 in-data-[layout=calendar]:text-xs", color)}>
      <KindIcon kind={kind} className={cn("size-4 in-data-[layout=calendar]:size-3.5", planIconColor(kind))} />
      <span className="in-data-[layout=calendar]:sr-only">{tLabels.dynamic(`planKinds.${kind}`, undefined, kind)}</span>
    </span>
  );
}

export function KindTags({
  name = "kind",
  value,
  onValueChange,
  kinds,
}: {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  kinds: readonly { id: string; label: string }[];
}) {
  const tLabels = useT("labels");
  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((kind) => {
        const selected = value === kind.id;
        const color = kind.id in PLAN_COLORS ? PLAN_COLORS[kind.id as PlanKindId] : "bg-muted";
        return (
          <label
            key={kind.id}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-sm",
              color,
              selected && "ring-2 ring-foreground ring-offset-1",
            )}
          >
            <input
              type="radio"
              name={name}
              value={kind.id}
              checked={selected}
              onChange={() => onValueChange(kind.id)}
              className="sr-only"
            />
            <KindIcon kind={kind.id} className={cn("size-4", planIconColor(kind.id))} />
            {tLabels.dynamic(`planKinds.${kind.id}`, undefined, kind.label)}
          </label>
        );
      })}
    </div>
  );
}

export function DateAndTime({
  name,
  dateLabel,
  timeLabel,
  defaultValue = "",
  required = false,
}: {
  name: string;
  dateLabel: string;
  timeLabel: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [datePart, timePart] = defaultValue.split("T");
  const [date, setDate] = useState(datePart ?? "");
  const [time, setTime] = useState((timePart ?? "").slice(0, 5));
  const combined = date && time ? `${date}T${time.slice(0, 5)}` : "";

  return (
    <>
      <Field label={dateLabel}>
        <Input
          type="date"
          value={date}
          required={required || time.length > 0}
          onChange={(event) => setDate(event.target.value)}
        />
      </Field>
      <Field label={timeLabel}>
        <Input
          type="time"
          step={60}
          value={time}
          required={required || date.length > 0}
          onChange={(event) => setTime(event.target.value)}
        />
      </Field>
      <input type="hidden" name={name} value={combined} className="hidden" />
    </>
  );
}

function When({
  name,
  dateLabel,
  timeLabel,
  defaultValue,
  required,
}: {
  name: string;
  dateLabel: string;
  timeLabel: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <DateAndTime
        name={name}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}

export function PlanForm({
  tripId,
  currency,
  people,
  destinations,
  tripDays,
  defaultDate = "",
  compact = false,
  flightLookup = false,
  open,
  onOpenChange,
}: {
  tripId: string;
  currency: string;
  people: PersonOption[];
  destinations: { id: string; name: string }[];
  tripDays: string[];
  defaultDate?: string;
  /** A small "Add a plan" button, for adding to a single day. */
  compact?: boolean;
  /** Whether the flight form can look flights up by number. */
  flightLookup?: boolean;
  /** Open it from elsewhere; it then shows no button of its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useT("schedule");
  const [kind, setKind] = useState<PlanKindId>("FLIGHT");
  const preset = defaultDate ? `${defaultDate}T` : "";
  const submitLabel =
    kind === "FLIGHT" ? t("form.addFlight") : kind === "STAY" ? t("form.addStay") : t("form.addToSchedule");

  return (
    <FormDialog
      title={t("form.addPlan")}
      triggerIcon={<Plus />}
      triggerVariant={compact ? "outline" : "default"}
      triggerSize={compact ? "sm" : "default"}
      triggerClassName={compact ? "w-full" : "w-full sm:w-fit"}
      open={open}
      onOpenChange={onOpenChange}
      wide
    >
      <ActionForm action={createPlan.bind(null, tripId)} submitLabel={submitLabel}>
        <FieldGroup label={t("form.kind")}>
          <KindTags value={kind} onValueChange={(next) => setKind(next as PlanKindId)} kinds={PLAN_KINDS} />
        </FieldGroup>
        {kind === "FLIGHT" ? (
          <FlightFields
            tripId={tripId}
            people={people}
            currency={currency}
            lookup={flightLookup}
            allowAllLegs
            departAt={preset}
            arriveAt={preset}
            showCost
          />
        ) : null}
        {kind === "STAY" ? (
          <StayFields destinations={destinations} currency={currency} checkIn={preset} checkOut={preset} showCost />
        ) : null}
        {kind !== "FLIGHT" && kind !== "STAY" ? <ScheduleFields startAt={preset} tripDays={tripDays} /> : null}
      </ActionForm>
    </FormDialog>
  );
}

/** One leg as the form holds it: the flight number and date live in the fields above. */
type LegDetails = Pick<
  FlightMatch,
  "airline" | "fromAirport" | "fromName" | "fromTerminal" | "toAirport" | "toName" | "toTerminal" | "durationMinutes"
> & {
  departTime: string;
  arriveDate: string;
  arriveTime: string;
};

function legDetails(match: FlightMatch): LegDetails {
  return {
    airline: match.airline,
    fromAirport: match.fromAirport,
    fromName: match.fromName,
    fromTerminal: match.fromTerminal,
    toAirport: match.toAirport,
    toName: match.toName,
    toTerminal: match.toTerminal,
    durationMinutes: match.durationMinutes,
    departTime: match.departAt.slice(11, 16),
    arriveDate: match.arriveAt.slice(0, 10),
    arriveTime: match.arriveAt.slice(11, 16),
  };
}

/** "2026-11-10" → "Tue 10 Nov". The form's dates are local wall-clock dates, so read them as UTC. */
function shortDay(date: string, locale: Locale) {
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return "";
  return day.toLocaleDateString(INTL_LOCALES[locale], { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function DayOffset({ offset }: { offset: number }) {
  if (offset === 0) return null;
  return <sup className="ms-0.5 text-xs text-muted-foreground">{offset > 0 ? `+${offset}` : offset}</sup>;
}

/** One end of a leg: airport, terminal, time, and day. */
function LegEnd({
  code,
  name,
  terminal,
  time,
  date,
  offset = 0,
  align = "start",
}: {
  code: string;
  name: string;
  terminal: string;
  time: string;
  date: string;
  offset?: number;
  align?: "start" | "end";
}) {
  const locale = useLocale();
  return (
    <div className={cn("grid min-w-0 content-start gap-0.5", align === "end" && "text-end")}>
      <AirportLabel code={code} fallbackName={name} align={align} />
      <p className="mt-1 font-medium">
        {time}
        <DayOffset offset={offset} />
      </p>
      <p className="text-xs text-muted-foreground">{shortDay(date, locale)}</p>
      {terminal ? <p className="text-xs text-muted-foreground">{terminalLabel(terminal, locale)}</p> : null}
    </div>
  );
}

/** A leg as a card: who flies it and both ends. */
function LegCard({
  leg,
  number,
  departDate,
  action,
}: {
  leg: LegDetails;
  number: string;
  departDate: string;
  action?: React.ReactNode;
}) {
  const locale = useLocale();
  const arriveDate = leg.arriveDate || departDate;
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 font-medium">
          <AirlineLogo code={airlineCodeOf(number)} className="size-6" />
          <span className="truncate">
            {leg.airline} <span className="font-mono">{number}</span>
          </span>
        </p>
        {action}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <LegEnd
          code={leg.fromAirport}
          name={leg.fromName}
          terminal={leg.fromTerminal}
          time={leg.departTime}
          date={departDate}
        />
        <div className="grid justify-items-center gap-0.5 pt-1 text-xs whitespace-nowrap text-muted-foreground">
          <Plane className="size-4" />
          {leg.durationMinutes ? <span>{formatMinutes(leg.durationMinutes, locale)}</span> : null}
        </div>
        <LegEnd
          code={leg.toAirport}
          name={leg.toName}
          terminal={leg.toTerminal}
          time={leg.arriveTime}
          date={arriveDate}
          offset={dayOffset(departDate, arriveDate)}
          align="end"
        />
      </div>
    </div>
  );
}

/** A choice from a lookup: one leg, or every leg of a flight number that stops on the way. */
type FlightOption = { legs: FlightMatch[]; all: boolean };

function flightOptions(journeys: FlightJourney[], allowAll: boolean): FlightOption[] {
  return journeys.flatMap((journey) => [
    ...(allowAll && journey.length > 1 ? [{ legs: journey, all: true }] : []),
    ...journey.map((leg) => ({ legs: [leg], all: false })),
  ]);
}

function FlightFields({
  tripId,
  people,
  currency,
  lookup = false,
  allowAllLegs = false,
  departAt = "",
  arriveAt = "",
  airline = "",
  flightNumber = "",
  fromAirport = "",
  fromTerminal = "",
  toAirport = "",
  toTerminal = "",
  durationMinutes = null,
  confirmation = "",
  seats = "",
  notes = "",
  travelerIds,
  showCost = false,
}: {
  tripId: string;
  people: PersonOption[];
  currency?: string;
  /** Whether the server can look flights up by number (AeroDataBox is set up). */
  lookup?: boolean;
  /** Whether a lookup can add every leg of a flight number at once, as separate flights. */
  allowAllLegs?: boolean;
  departAt?: string;
  arriveAt?: string;
  airline?: string;
  flightNumber?: string;
  fromAirport?: string;
  fromTerminal?: string;
  toAirport?: string;
  toTerminal?: string;
  /** The real flying time, which only a lookup knows. */
  durationMinutes?: number | null;
  confirmation?: string;
  /** Seat numbers, "14A, 14B". */
  seats?: string;
  notes?: string;
  travelerIds?: string[];
  showCost?: boolean;
}) {
  const t = useT("schedule");
  const locale = useLocale();
  const [number, setNumber] = useState(flightNumber);
  const [departDate, setDepartDate] = useState(departAt.split("T")[0] ?? "");
  const [leg, setLeg] = useState<LegDetails>({
    airline,
    fromAirport,
    fromName: "",
    fromTerminal,
    toAirport,
    toName: "",
    toTerminal,
    durationMinutes,
    departTime: (departAt.split("T")[1] ?? "").slice(0, 5),
    arriveDate: arriveAt.split("T")[0] ?? "",
    arriveTime: (arriveAt.split("T")[1] ?? "").slice(0, 5),
  });
  // Every leg of a flight number that stops, when the traveler adds them all. Each is saved as a flight.
  const [legs, setLegs] = useState<FlightMatch[] | null>(null);
  const complete = Boolean(
    airline && fromAirport && toAirport && leg.departTime && leg.arriveDate && leg.arriveTime,
  );
  // "summary": cards for the flight, after a lookup or for a saved flight. "manual": every field.
  // "start": only the number and date, until a lookup or "Enter details by hand".
  const [view, setView] = useState<"start" | "summary" | "manual">(
    complete ? "summary" : lookup ? "start" : "manual",
  );
  // A lookup bumps the version, which remounts the manual inputs with the new defaults.
  const [version, setVersion] = useState(0);
  const [options, setOptions] = useState<FlightOption[]>([]);
  // Whether the looked-up flight number stops on the way, flying more than one leg.
  const [stopping, setStopping] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [pending, startTransition] = useTransition();

  function choose(option: FlightOption) {
    const [first] = option.legs;
    setNumber(first.flightNumber || number);
    setDepartDate(first.departAt.slice(0, 10));
    if (option.all) {
      setLegs(option.legs);
    } else {
      setLegs(null);
      setLeg({ ...legDetails(first), airline: first.airline || leg.airline });
      setVersion((current) => current + 1);
    }
    setChoosing(false);
    // Without an airline name the summary could not be saved, so show the fields to fill it in.
    setView(option.all || first.airline || leg.airline ? "summary" : "manual");
  }

  function lookUp() {
    if (!number.trim() || !departDate || pending) return;
    setLookupError("");
    setChoosing(false);
    startTransition(async () => {
      const result = await lookupFlight(tripId, number, departDate);
      if ("error" in result) {
        setLookupError(result.error ?? t("form.lookupFailed"));
        return;
      }
      const found = flightOptions(result.journeys, allowAllLegs);
      setOptions(found);
      setStopping(result.journeys.some((journey) => journey.length > 1));
      if (found.length === 1) choose(found[0]);
      else setChoosing(true);
    });
  }

  const arriveDate = leg.arriveDate || departDate;
  const departValue = departDate && leg.departTime ? `${departDate}T${leg.departTime}` : "";
  const arriveValue = arriveDate && leg.arriveTime ? `${arriveDate}T${leg.arriveTime}` : "";
  const changeButton =
    options.length > 1 ? (
      <Button type="button" variant="outline" size="sm" className="bg-muted hover:bg-accent" onClick={() => setChoosing(true)}>
        {t("form.change")}
      </Button>
    ) : null;

  return (
    <>
      <div className="grid gap-1.5">
        {/* One row on every width: the inputs shrink before the button would wrap onto a line of its own. */}
        <div
          className={cn(
            "grid items-end gap-2",
            lookup ? "grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]",
          )}
        >
          <Field label={t("form.flightNumber")}>
            <Input
              name="flightNumber"
              value={number}
              placeholder="LH400"
              autoCapitalize="characters"
              onChange={(event) => setNumber(event.target.value)}
              onKeyDown={(event) => {
                // Enter looks the flight up instead of submitting a half-filled form.
                if (lookup && event.key === "Enter") {
                  event.preventDefault();
                  lookUp();
                }
              }}
              required
            />
          </Field>
          <Field label={t("form.date")}>
            <Input
              type="date"
              value={departDate}
              className="min-w-0"
              onChange={(event) => setDepartDate(event.target.value)}
              required
            />
          </Field>
          {lookup ? (
            <Button
              type="button"
              variant={view === "start" ? "default" : "outline"}
              onClick={lookUp}
              disabled={pending || !number.trim() || !departDate}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Search />}
              <span className="max-[359px]:sr-only">{t("form.lookUp")}</span>
            </Button>
          ) : null}
        </div>
        {lookupError ? <p className="text-xs text-destructive">{lookupError}</p> : null}
        {choosing && options.length > 1 ? (
          <div className="grid gap-1">
            <p className="text-xs text-muted-foreground">
              {stopping
                ? t("form.stopsPrompt")
                : t("form.severalMatch")}
            </p>
            {options.map((option) => {
              const first = option.legs[0];
              const last = option.legs[option.legs.length - 1];
              return (
                <Button
                  key={`${option.all ? "all" : "leg"}-${journeyRoute(option.legs)}-${first.departAt}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start py-1.5 text-start whitespace-normal"
                  onClick={() => choose(option)}
                >
                  <AirlineLogo code={airlineCodeOf(first.flightNumber)} className="size-4" />
                  <span className="font-mono">{journeyRoute(option.legs)}</span>
                  <span className="text-muted-foreground">
                    {shortDay(first.departAt.slice(0, 10), locale)} {first.departAt.slice(11)} – {last.arriveAt.slice(11)}
                    <DayOffset offset={dayOffset(first.departAt, last.arriveAt)} />
                    {option.legs.every((part) => part.durationMinutes)
                      ? ` · ${(() => {
                          const total = formatMinutes(
                            option.legs.reduce((sum, part) => sum + (part.durationMinutes ?? 0), 0),
                            locale,
                          );
                          return option.all ? t("form.flying", { duration: total }) : total;
                        })()}`
                      : ""}
                    {option.all ? ` · ${t("form.allLegs", { count: option.legs.length })}` : ""}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : null}
        {view === "start" && !choosing ? (
          <button
            type="button"
            className="justify-self-start text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => setView("manual")}
          >
            {t("form.byHand")}
          </button>
        ) : null}
      </div>

      {view === "summary" && legs ? (
        <div className="grid gap-1.5">
          {legs.map((part, index) => {
            const previous = legs[index - 1];
            return (
              <Fragment key={`${part.fromAirport}-${part.departAt}`}>
                {previous ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {t("form.stopIn", {
                      duration: formatMinutes(minutesBetween(previous.arriveAt, part.departAt), locale),
                      airport: part.fromAirport,
                    })}
                  </p>
                ) : null}
                <LegCard
                  leg={legDetails(part)}
                  number={part.flightNumber}
                  departDate={part.departAt.slice(0, 10)}
                  action={index === 0 ? changeButton : null}
                />
              </Fragment>
            );
          })}
          <p className="text-xs text-muted-foreground">
            {t("form.addsLegs", { count: legs.length })}
          </p>
          <input
            type="hidden"
            name="legs"
            value={JSON.stringify(
              legs.map((part) => ({
                airline: part.airline,
                flightNumber: part.flightNumber,
                fromAirport: part.fromAirport,
                fromTerminal: part.fromTerminal,
                toAirport: part.toAirport,
                toTerminal: part.toTerminal,
                departAt: part.departAt,
                arriveAt: part.arriveAt,
                durationMinutes: part.durationMinutes,
              })),
            )}
          />
        </div>
      ) : null}

      {view === "summary" && !legs ? (
        <div className="grid gap-1.5">
          <LegCard
            leg={leg}
            number={number}
            departDate={departDate}
            action={
              <span className="flex shrink-0 gap-1.5">
                {changeButton}
                <Button type="button" variant="outline" size="sm" className="bg-muted hover:bg-accent" onClick={() => setView("manual")}>
                  <Pencil />
                  {t.rich("form.editDetails", { more: (chunks) => <span className="max-sm:sr-only">{chunks}</span> })}
                </Button>
              </span>
            }
          />
          <p className="text-xs text-muted-foreground">{t("form.localTimes")}</p>
          <input type="hidden" name="airline" value={leg.airline} />
          <input type="hidden" name="fromAirport" value={leg.fromAirport} />
          <input type="hidden" name="fromTerminal" value={leg.fromTerminal} />
          <input type="hidden" name="toAirport" value={leg.toAirport} />
          <input type="hidden" name="toTerminal" value={leg.toTerminal} />
        </div>
      ) : null}

      {view === "manual" ? (
        <>
          <Field label={t("form.airline")}>
            <AirlineInput key={`airline-${version}`} name="airline" defaultValue={leg.airline} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["from", "to"] as const).map((end) => (
              <div key={end} className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                <Field label={end === "from" ? t("form.from") : t("form.to")}>
                  <AirportInput
                    key={`${end}-${version}`}
                    name={end === "from" ? "fromAirport" : "toAirport"}
                    defaultValue={end === "from" ? leg.fromAirport : leg.toAirport}
                    placeholder={end === "from" ? "TLV" : "MUC"}
                    required
                  />
                </Field>
                <Field label={t("form.terminal")}>
                  <Input
                    name={end === "from" ? "fromTerminal" : "toTerminal"}
                    value={end === "from" ? leg.fromTerminal : leg.toTerminal}
                    placeholder="1"
                    maxLength={20}
                    onChange={(event) =>
                      setLeg({ ...leg, [end === "from" ? "fromTerminal" : "toTerminal"]: event.target.value })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={t("form.departs")} className="col-span-2 sm:col-span-1">
              <Input
                type="time"
                step={60}
                value={leg.departTime}
                onChange={(event) => setLeg({ ...leg, departTime: event.target.value, durationMinutes: null })}
                required
              />
            </Field>
            <Field label={t("form.arrivalDate")}>
              <Input
                type="date"
                value={arriveDate}
                onChange={(event) => setLeg({ ...leg, arriveDate: event.target.value, durationMinutes: null })}
                required
              />
            </Field>
            <Field label={t("form.arrives")}>
              <Input
                type="time"
                step={60}
                value={leg.arriveTime}
                onChange={(event) => setLeg({ ...leg, arriveTime: event.target.value, durationMinutes: null })}
                required
              />
            </Field>
          </div>
        </>
      ) : null}

      {view !== "start" ? (
        <>
          {legs && view === "summary" ? null : (
            <>
              <input type="hidden" name="departAt" value={departValue} />
              <input type="hidden" name="arriveAt" value={arriveValue} />
              <input type="hidden" name="durationMinutes" value={leg.durationMinutes ?? ""} />
            </>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("form.confirmation")}>
              <Input name="confirmation" defaultValue={confirmation} />
            </Field>
            {legs ? (
              // Each leg gets its own seats, so they're added per flight after saving.
              <p className="self-end pb-2 text-xs text-muted-foreground sm:pb-1.5">
                {t("form.seatsPerLeg")}
              </p>
            ) : (
              <Field label={t("form.seatsOptional")}>
                <Input
                  name="seats"
                  defaultValue={seats}
                  placeholder="14A, 14B"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </Field>
            )}
          </div>
          <FieldGroup label={t("form.travelers")}>
            <CheckList name="traveler" options={people} checkedIds={travelerIds} defaultChecked={travelerIds == null} />
          </FieldGroup>
          <Field label={t("form.notes")}>
            <Textarea name="notes" rows={2} defaultValue={notes} />
          </Field>
          {showCost && currency ? <CostFields currency={currency} /> : null}
        </>
      ) : null}
    </>
  );
}

function StayFields({
  destinations,
  currency,
  name = "",
  address = "",
  destinationId = "",
  confirmation = "",
  notes = "",
  checkIn = "",
  checkOut = "",
  showCost = false,
}: {
  destinations: { id: string; name: string }[];
  currency?: string;
  name?: string;
  address?: string;
  destinationId?: string;
  confirmation?: string;
  notes?: string;
  checkIn?: string;
  checkOut?: string;
  showCost?: boolean;
}) {
  const t = useT("schedule");
  return (
    <>
      <Field label={t("form.name")}>
        <Input name="name" defaultValue={name} required />
      </Field>
      <Field label={t("form.address")}>
        <Input name="address" defaultValue={address} />
      </Field>
      <Field label={t("form.destination")}>
        <Select name="destinationId" defaultValue={destinationId}>
          <option value="">{t("form.none")}</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <When name="checkIn" dateLabel={t("form.checkInDate")} timeLabel={t("form.time")} defaultValue={checkIn} required />
        <When name="checkOut" dateLabel={t("form.checkOutDate")} timeLabel={t("form.time")} defaultValue={checkOut} required />
      </div>
      <Field label={t("form.confirmation")}>
        <Input name="confirmation" defaultValue={confirmation} />
      </Field>
      <Field label={t("form.notes")}>
        <Textarea name="notes" rows={2} defaultValue={notes} />
      </Field>
      {showCost && currency ? <CostFields currency={currency} /> : null}
    </>
  );
}

function ScheduleFields({ startAt = "", tripDays }: { startAt?: string; tripDays: string[] }) {
  const t = useT("schedule");
  return (
    <>
      <Field label={t("form.title")}>
        <Input name="title" required />
      </Field>
      <ScheduleWhenFields tripDays={tripDays} defaultStart={startAt} required />
      <Field label={t("form.place")}>
        <Input name="placeName" />
      </Field>
      <Field label={t("form.notes")}>
        <Textarea name="notes" rows={2} />
      </Field>
    </>
  );
}

export type StayDraft = {
  id: string;
  name: string;
  address: string;
  destinationId: string;
  confirmation: string;
  notes: string;
  checkIn: string;
  checkOut: string;
};

export function StayEditor({
  tripId,
  stay,
  destinations,
  onSaved,
}: {
  tripId: string;
  stay: StayDraft;
  destinations: { id: string; name: string }[];
  onSaved?: () => void;
}) {
  const t = useT("schedule");
  return (
    <ActionForm action={updateStay.bind(null, tripId, stay.id)} submitLabel={t("form.saveStay")} className="grid gap-3" onSaved={onSaved}>
      <StayFields
        destinations={destinations}
        name={stay.name}
        address={stay.address}
        destinationId={stay.destinationId}
        confirmation={stay.confirmation}
        notes={stay.notes}
        checkIn={stay.checkIn}
        checkOut={stay.checkOut}
      />
    </ActionForm>
  );
}

export function FlightEditor({
  tripId,
  flight,
  people,
  lookup = false,
  onSaved,
}: {
  tripId: string;
  flight: FlightDraft;
  people: PersonOption[];
  /** Whether the form can look flights up by number. */
  lookup?: boolean;
  onSaved?: () => void;
}) {
  const t = useT("schedule");
  return (
    <ActionForm
      action={updateFlight.bind(null, tripId, flight.id)}
      submitLabel={t("form.saveFlight")}
      className="grid gap-3"
      onSaved={onSaved}
    >
      <FlightFields
        tripId={tripId}
        people={people}
        airline={flight.airline}
        flightNumber={flight.flightNumber}
        fromAirport={flight.fromAirport}
        fromTerminal={flight.fromTerminal}
        toAirport={flight.toAirport}
        toTerminal={flight.toTerminal}
        durationMinutes={flight.durationMinutes}
        lookup={lookup}
        departAt={flight.departAt}
        arriveAt={flight.arriveAt}
        confirmation={flight.confirmation}
        seats={flight.seats}
        notes={flight.notes}
        travelerIds={flight.travelerIds}
      />
    </ActionForm>
  );
}
