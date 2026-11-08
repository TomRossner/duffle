"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(start: string, end: string) {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.round((to - from) / DAY_MS);
}

/** Start and end date inputs that keep the end on or after the start and show the trip's length. */
export function TripDatesFields({ defaultStart = "", defaultEnd = "" }: { defaultStart?: string; defaultEnd?: string }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const nights = start && end ? daysBetween(start, end) : null;

  return (
    <div className="grid gap-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start">
          <Input
            name="startDate"
            type="date"
            required
            value={start}
            onChange={(event) => {
              const next = event.target.value;
              setStart(next);
              // Moving the start past the end drags the end along with it.
              if (next && end && end < next) setEnd(next);
            }}
          />
        </Field>
        <Field label="End">
          <Input name="endDate" type="date" required min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} />
        </Field>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
        <CalendarDays className="size-3.5 shrink-0" />
        {nights === null
          ? "Pick the first and last day of the trip."
          : nights === 0
            ? "A day trip."
            : `${nights + 1} days, ${nights} ${nights === 1 ? "night" : "nights"}.`}
      </p>
    </div>
  );
}
