"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(start: string, end: string) {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.round((to - from) / DAY_MS);
}

/** Start and end date inputs that keep the end on or after the start and show the trip's length. */
export function TripDatesFields({ defaultStart = "", defaultEnd = "" }: { defaultStart?: string; defaultEnd?: string }) {
  const t = useT("trips");
  const tCommon = useT("common");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const nights = start && end ? daysBetween(start, end) : null;

  return (
    <div className="grid gap-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("dates.start")}>
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
        <Field label={t("dates.end")}>
          <Input name="endDate" type="date" required min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} />
        </Field>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
        <CalendarDays className="size-3.5 shrink-0" />
        {nights === null
          ? t("dates.pick")
          : nights === 0
            ? t("dates.dayTrip")
            : t("dates.length", {
                days: tCommon("days", { count: nights + 1 }),
                nights: tCommon("nights", { count: nights }),
              })}
      </p>
    </div>
  );
}
