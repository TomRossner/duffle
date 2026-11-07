"use client";

import { useState } from "react";
import { CheckBox } from "@/components/checkbox";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const monthDay = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" });

function dayLabel(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  return { weekday: weekday.format(date), date: monthDay.format(date) };
}

/**
 * Start/end, "All day", and repeat-on-days controls shared by the schedule's plan and activity forms.
 * Submits startAt / endAt ("YYYY-MM-DDTHH:mm"), allDay ("on"), and one repeatDates entry per extra day.
 */
export function ScheduleWhenFields({
  tripDays,
  defaultStart = "",
  defaultEnd = "",
  defaultAllDay = false,
  defaultRepeat = [],
  required = false,
  editing = false,
}: {
  tripDays: string[];
  defaultStart?: string;
  defaultEnd?: string;
  defaultAllDay?: boolean;
  /** Other days the plan is already on (its series), shown ticked when editing. */
  defaultRepeat?: string[];
  required?: boolean;
  /** When editing, the ticked days are the plan's full set of days: unticking a day removes it from there. */
  editing?: boolean;
}) {
  const [startDate, setStartDate] = useState(defaultStart.slice(0, 10));
  const [startTime, setStartTime] = useState(defaultAllDay ? "" : defaultStart.slice(11, 16));
  const [endDate, setEndDate] = useState(defaultEnd.slice(0, 10));
  const [endTime, setEndTime] = useState(defaultEnd.slice(11, 16));
  const [allDay, setAllDay] = useState(defaultAllDay);
  const [repeat, setRepeat] = useState<Set<string>>(() => new Set(defaultRepeat));
  const seriesSize = defaultRepeat.length + 1;

  const startAt = allDay ? (startDate ? `${startDate}T00:00` : "") : startDate && startTime ? `${startDate}T${startTime}` : "";
  // An end time without its own date ends on the start day.
  const endAt = !allDay && endTime && (endDate || startDate) ? `${endDate || startDate}T${endTime}` : "";
  const otherDays = tripDays.filter((day) => day !== startDate);
  const selected = otherDays.filter((day) => repeat.has(day));

  function toggle(day: string) {
    setRepeat((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
        <CheckBox name="allDay" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
        All day
      </label>

      <div className={cn("grid gap-3", !allDay && "sm:grid-cols-2")}>
        <div className={cn("grid gap-3", !allDay && "grid-cols-2")}>
          <Field label={allDay ? "Day" : "Starts"}>
            <Input
              type="date"
              value={startDate}
              required={required || allDay || startTime.length > 0}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          {!allDay ? (
            <Field label="Time">
              <Input
                type="time"
                step={60}
                value={startTime}
                required={required || startDate.length > 0}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </Field>
          ) : null}
        </div>
        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ends">
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
            <Field label="Time">
              <Input type="time" step={60} value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>

      {tripDays.length > 1 ? (
        <div className="grid gap-2 rounded-lg bg-muted/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Repeat on</span>
            <span className="flex gap-1">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-primary sm:px-2 sm:py-0.5 sm:text-xs hover:bg-background"
                onClick={() => setRepeat(new Set(otherDays))}
              >
                Every day
              </button>
              {selected.length > 0 ? (
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground sm:px-2 sm:py-0.5 sm:text-xs hover:bg-background"
                  onClick={() => setRepeat(new Set())}
                >
                  Clear
                </button>
              ) : null}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tripDays.map((day) => {
              const label = dayLabel(day);
              const isStart = day === startDate;
              const checked = isStart || repeat.has(day);
              return (
                <label
                  key={day}
                  className={cn(
                    "flex min-w-14 cursor-pointer flex-col items-center rounded-lg border px-2 py-1 text-xs leading-tight transition-colors",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted",
                    isStart && "cursor-default opacity-70",
                  )}
                  title={isStart ? "The day chosen above" : undefined}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    name={isStart ? undefined : "repeatDates"}
                    value={day}
                    checked={checked}
                    disabled={isStart}
                    onChange={() => toggle(day)}
                  />
                  <span className="font-medium">{label.weekday}</span>
                  <span>{label.date}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? editing && seriesSize > 1
                ? "Only on the day above. Saving removes it from the other days."
                : "Pick more days to add this on each of them, with the same times."
              : `On ${selected.length + 1} days, with the same times.${
                  editing && seriesSize > 1 ? " Changes apply to every day, and unticked days are removed." : ""
                }`}
          </p>
        </div>
      ) : null}

      <input type="hidden" name="startAt" value={startAt} />
      <input type="hidden" name="endAt" value={endAt} />
    </div>
  );
}
