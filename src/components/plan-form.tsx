"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { CheckList, CostFields, Field, FieldGroup, Select } from "@/components/fields";
import { KindIcon } from "@/components/kind-icon";
import { ScheduleWhenFields } from "@/components/schedule-when-fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlan, updateFlight, updateStay } from "@/lib/actions/schedule";
import { PLAN_COLORS, PLAN_KINDS, planLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

type PlanKindId = (typeof PLAN_KINDS)[number]["id"];

export type PersonOption = { id: string; label: React.ReactNode };

export type FlightDraft = {
  id: string;
  airline: string;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  departAt: string;
  arriveAt: string;
  confirmation: string;
  notes: string;
  travelerIds: string[];
};

export function PlanTag({ kind }: { kind: string }) {
  const color = kind in PLAN_COLORS ? PLAN_COLORS[kind as PlanKindId] : "bg-muted text-foreground";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs in-data-[layout=calendar]:px-1", color)}>
      <KindIcon kind={kind} className="size-3.5" />
      <span className="in-data-[layout=calendar]:sr-only">{planLabel(kind)}</span>
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
            <KindIcon kind={kind.id} className="size-4" />
            {kind.label}
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
}: {
  tripId: string;
  currency: string;
  people: PersonOption[];
  destinations: { id: string; name: string }[];
  tripDays: string[];
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PlanKindId>("FLIGHT");
  const preset = defaultDate ? `${defaultDate}T` : "";
  const submitLabel = kind === "FLIGHT" ? "Add flight" : kind === "STAY" ? "Add stay" : "Add to schedule";

  if (!open) {
    return (
      <Button type="button" size="lg" className="h-10 w-full" onClick={() => setOpen(true)}>
        <Plus />
        Add a plan
      </Button>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl bg-muted/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Add a plan</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      <ActionForm action={createPlan.bind(null, tripId)} submitLabel={submitLabel} onSaved={() => setOpen(false)}>
        <FieldGroup label="Kind">
          <KindTags value={kind} onValueChange={(next) => setKind(next as PlanKindId)} kinds={PLAN_KINDS} />
        </FieldGroup>
        {kind === "FLIGHT" ? (
          <FlightFields people={people} currency={currency} departAt={preset} arriveAt={preset} showCost />
        ) : null}
        {kind === "STAY" ? (
          <StayFields destinations={destinations} currency={currency} checkIn={preset} checkOut={preset} showCost />
        ) : null}
        {kind !== "FLIGHT" && kind !== "STAY" ? <ScheduleFields startAt={preset} tripDays={tripDays} /> : null}
      </ActionForm>
    </div>
  );
}

function FlightFields({
  people,
  currency,
  departAt = "",
  arriveAt = "",
  airline = "",
  flightNumber = "",
  fromAirport = "",
  toAirport = "",
  confirmation = "",
  notes = "",
  travelerIds,
  showCost = false,
}: {
  people: PersonOption[];
  currency?: string;
  departAt?: string;
  arriveAt?: string;
  airline?: string;
  flightNumber?: string;
  fromAirport?: string;
  toAirport?: string;
  confirmation?: string;
  notes?: string;
  travelerIds?: string[];
  showCost?: boolean;
}) {
  return (
    <>
      <Field label="Airline">
        <Input name="airline" defaultValue={airline} required />
      </Field>
      <Field label="Flight number">
        <Input name="flightNumber" defaultValue={flightNumber} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From">
          <Input name="fromAirport" defaultValue={fromAirport} placeholder="TLV" required />
        </Field>
        <Field label="To">
          <Input name="toAirport" defaultValue={toAirport} placeholder="MUC" required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <When name="departAt" dateLabel="Departs" timeLabel="Time" defaultValue={departAt} required />
        <When name="arriveAt" dateLabel="Arrives" timeLabel="Time" defaultValue={arriveAt} required />
      </div>
      <Field label="Confirmation">
        <Input name="confirmation" defaultValue={confirmation} />
      </Field>
      <FieldGroup label="Travelers">
        <CheckList name="traveler" options={people} checkedIds={travelerIds} defaultChecked={travelerIds == null} />
      </FieldGroup>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={notes} />
      </Field>
      {showCost && currency ? <CostFields currency={currency} /> : null}
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
  return (
    <>
      <Field label="Name">
        <Input name="name" defaultValue={name} required />
      </Field>
      <Field label="Address">
        <Input name="address" defaultValue={address} />
      </Field>
      <Field label="Destination">
        <Select name="destinationId" defaultValue={destinationId}>
          <option value="">None</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <When name="checkIn" dateLabel="Check-in date" timeLabel="Time" defaultValue={checkIn} required />
        <When name="checkOut" dateLabel="Check-out date" timeLabel="Time" defaultValue={checkOut} required />
      </div>
      <Field label="Confirmation">
        <Input name="confirmation" defaultValue={confirmation} />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={notes} />
      </Field>
      {showCost && currency ? <CostFields currency={currency} /> : null}
    </>
  );
}

function ScheduleFields({ startAt = "", tripDays }: { startAt?: string; tripDays: string[] }) {
  return (
    <>
      <Field label="Title">
        <Input name="title" required />
      </Field>
      <ScheduleWhenFields tripDays={tripDays} defaultStart={startAt} required />
      <Field label="Place">
        <Input name="placeName" />
      </Field>
      <Field label="Notes">
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
  return (
    <ActionForm action={updateStay.bind(null, tripId, stay.id)} submitLabel="Save stay" className="grid gap-3" onSaved={onSaved}>
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
  onSaved,
}: {
  tripId: string;
  flight: FlightDraft;
  people: PersonOption[];
  onSaved?: () => void;
}) {
  return (
    <ActionForm
      action={updateFlight.bind(null, tripId, flight.id)}
      submitLabel="Save flight"
      className="grid gap-3"
      onSaved={onSaved}
    >
      <FlightFields
        people={people}
        airline={flight.airline}
        flightNumber={flight.flightNumber}
        fromAirport={flight.fromAirport}
        toAirport={flight.toAirport}
        departAt={flight.departAt}
        arriveAt={flight.arriveAt}
        confirmation={flight.confirmation}
        notes={flight.notes}
        travelerIds={flight.travelerIds}
      />
    </ActionForm>
  );
}
