"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * One timed entry on the schedule. Times are the place's local wall-clock time as "YYYY-MM-DDTHH:mm",
 * which is how the app stores them, so they're compared with the device's local clock: right while the
 * traveler is there, which is when the highlight matters.
 */
export type TimelineEntry = {
  id: string;
  start: string;
  end: string | null;
  allDay: boolean;
};

export type EntryState =
  | { kind: "current"; minutesLeft: number; progress: number }
  | { kind: "next"; minutesUntil: number }
  | { kind: "past" }
  | null;

/** How long a plan without an end time counts as happening now. */
const DEFAULT_MINUTES = 60;
/** "Up next" only for a plan starting within this many minutes. */
const NEXT_WITHIN_MINUTES = 24 * 60;

const minutes = (value: string) => Date.parse(`${value}:00Z`) / 60000;

function localNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 95 → "1h 35m", 2900 → "2d". */
export function formatSpan(total: number) {
  const value = Math.max(0, Math.round(total));
  if (value >= 48 * 60) return `${Math.round(value / (24 * 60))}d`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

type Clock = { now: string | null; today: string | null; states: Map<string, EntryState> };

const ClockContext = createContext<Clock>({ now: null, today: null, states: new Map() });

export function useScheduleClock() {
  return useContext(ClockContext);
}

export function useEntryState(id: string | undefined) {
  const { states } = useContext(ClockContext);
  return id ? (states.get(id) ?? null) : null;
}

export function ScheduleClockProvider({
  timeline,
  tripDays,
  children,
}: {
  timeline: TimelineEntry[];
  /** First and last day of the trip (YYYY-MM-DD); past plans are only dimmed while the trip is on. */
  tripDays: [string, string];
  children: React.ReactNode;
}) {
  // Null until mounted, so the server render and the first client render match.
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(localNow());
    tick();
    const timer = setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const clock = useMemo<Clock>(() => {
    const states = new Map<string, EntryState>();
    if (!now) return { now, today: null, states };
    const today = now.slice(0, 10);
    const at = minutes(now);
    const tripOn = today >= tripDays[0] && today <= tripDays[1];
    let next: { id: string; minutesUntil: number } | null = null;

    for (const entry of timeline) {
      if (entry.allDay) {
        if (tripOn && entry.start.slice(0, 10) < today) states.set(entry.id, { kind: "past" });
        continue;
      }
      const start = minutes(entry.start);
      const endValue = entry.end ? minutes(entry.end) : NaN;
      const end = endValue > start ? endValue : start + DEFAULT_MINUTES;
      if (at >= start && at < end) {
        states.set(entry.id, { kind: "current", minutesLeft: end - at, progress: (at - start) / (end - start) });
      } else if (at >= end) {
        if (tripOn) states.set(entry.id, { kind: "past" });
      } else if (start - at <= NEXT_WITHIN_MINUTES && (!next || start - at < next.minutesUntil)) {
        next = { id: entry.id, minutesUntil: start - at };
      }
    }
    if (next) states.set(next.id, { kind: "next", minutesUntil: next.minutesUntil });
    return { now, today, states };
  }, [now, timeline, tripDays]);

  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}
