"use client";

import { useState } from "react";
import { CheckBox } from "@/components/checkbox";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

function dayLabel(day: string, locale: Locale) {
  const date = new Date(`${day}T00:00:00Z`);
  const intl = INTL_LOCALES[locale];
  return {
    weekday: date.toLocaleDateString(intl, { weekday: "short", timeZone: "UTC" }),
    date: date.toLocaleDateString(intl, { day: "numeric", month: "short", timeZone: "UTC" }),
  };
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
  const t = useT("schedule");
  const locale = useLocale();
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
        {t("when.allDay")}
      </label>

      <div className={cn("grid gap-3", !allDay && "sm:grid-cols-2")}>
        <div className={cn("grid gap-3", !allDay && "grid-cols-2")}>
          <Field label={allDay ? t("when.day") : t("when.starts")}>
            <Input
              type="date"
              value={startDate}
              required={required || allDay || startTime.length > 0}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          {!allDay ? (
            <Field label={t("when.time")}>
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
            <Field label={t("when.ends")}>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
            <Field label={t("when.time")}>
              <Input type="time" step={60} value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>

      {tripDays.length > 1 ? (
        <div className="grid gap-2 rounded-lg bg-muted/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{t("when.repeatOn")}</span>
            <span className="flex gap-1">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-primary sm:px-2 sm:py-0.5 sm:text-xs hover:bg-background"
                onClick={() => setRepeat(new Set(otherDays))}
              >
                {t("when.everyDay")}
              </button>
              {selected.length > 0 ? (
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground sm:px-2 sm:py-0.5 sm:text-xs hover:bg-background"
                  onClick={() => setRepeat(new Set())}
                >
                  {t("when.clear")}
                </button>
              ) : null}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tripDays.map((day) => {
              const label = dayLabel(day, locale);
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
                  title={isStart ? t("when.chosenDay") : undefined}
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
                ? t("when.onlyAbove")
                : t("when.pickMore")
              : `${t("when.onDays", { count: selected.length + 1 })}${editing && seriesSize > 1 ? t("when.appliesAll") : ""}`}
          </p>
        </div>
      ) : null}

      <input type="hidden" name="startAt" value={startAt} />
      <input type="hidden" name="endAt" value={endAt} />
    </div>
  );
}
