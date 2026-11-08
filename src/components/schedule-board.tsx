"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays, List, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DaySection } from "@/components/day-editor";
import {
  formatSpan,
  ScheduleClockProvider,
  useEntryState,
  useScheduleClock,
  type TimelineEntry,
} from "@/components/schedule-clock";
import { buttonVariants } from "@/components/ui/button";
import { WeatherMark } from "@/components/weather-mark";
import type { Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { formatMonthYear, weekdayNames } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type ScheduleDay = {
  key: string;
  date: string;
  dateLabel: string;
  condition: string | null;
  forecast: string | null;
  /** The day's plans. The same nodes fill a calendar cell and the list, which style them by layout. */
  content: React.ReactNode;
};

let suppressDayOpenUntil = 0;

function suppressDayOpen() {
  suppressDayOpenUntil = Date.now() + 400;
}

export function ScheduleItem({
  label,
  details,
  children,
  opensInList = false,
  icon,
  description,
  actions,
  wide = false,
  timeId,
}: {
  /** The item's id in the board's timeline, to highlight it while it's happening or up next. */
  timeId?: string;
  label: string;
  details: React.ReactNode;
  children: React.ReactNode;
  /** Open the dialog from the list layout too, not only from the calendar. */
  opensInList?: boolean;
  /** Shown before the title in the dialog header. */
  icon?: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons beside the close button in the dialog header. */
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  const t = useT("schedule");
  const tCommon = useT("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const state = useEntryState(timeId);
  const inCalendar = (element: HTMLElement) =>
    element.closest("[data-layout]")?.getAttribute("data-layout") === "calendar";

  return (
    <>
      <div
        data-schedule-item
        data-time-id={timeId}
        data-time-state={state?.kind}
        className={cn(
          "relative min-w-0",
          opensInList && "rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          state?.kind === "current" &&
            "rounded-lg ring-2 ring-primary mt-2.5 in-data-[layout=calendar]:mt-0 in-data-[layout=calendar]:rounded-md",
          state?.kind === "next" &&
            "rounded-lg ring-1 ring-primary/60 mt-2.5 in-data-[layout=calendar]:mt-0 in-data-[layout=calendar]:rounded-md",
          state?.kind === "past" && "opacity-55 transition-opacity hover:opacity-100 focus-visible:opacity-100",
        )}
        role={opensInList ? "button" : undefined}
        tabIndex={opensInList ? 0 : undefined}
        aria-label={opensInList ? t("board.openDetails", { name: label }) : undefined}
        onKeyDown={(event) => {
          if (!opensInList || event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setOpen(true);
        }}
        onMouseDown={(event) => {
          if (!inCalendar(event.currentTarget)) return;
          event.stopPropagation();
        }}
        onClick={(event) => {
          const calendar = inCalendar(event.currentTarget);
          if (!calendar && !opensInList) return;
          if (calendar) {
            event.stopPropagation();
            suppressDayOpen();
          }
          const target = event.target as HTMLElement;
          // Clicks inside the dialog bubble up here through the portal; only the card itself opens it.
          if (!event.currentTarget.contains(target)) return;
          if (target.closest("button, a, [role=menu], [role=menuitem]")) return;
          // Leave text selection alone: dragging over the card to copy a code shouldn't open it.
          if (window.getSelection()?.toString()) return;
          setOpen(true);
        }}
      >
        {state?.kind === "current" ? (
          <>
            <span className="pointer-events-none absolute -top-2.5 start-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm in-data-[layout=calendar]:hidden">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary-foreground" />
              </span>
              {t("board.nowLeft", { time: formatSpan(state.minutesLeft, locale, t) })}
            </span>
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg in-data-[layout=calendar]:hidden"
              aria-hidden
            >
              <span className="block h-full bg-primary" style={{ width: `${Math.round(state.progress * 100)}%` }} />
            </span>
          </>
        ) : state?.kind === "next" ? (
          <span className="pointer-events-none absolute -top-2.5 start-3 z-10 rounded-full border border-primary/40 bg-background px-2 py-0.5 text-xs font-medium text-primary in-data-[layout=calendar]:hidden">
            {t("board.upNext", { time: formatSpan(state.minutesUntil, locale, t) })}
          </span>
        ) : null}
        {children}
      </div>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) suppressDayOpen();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup
              className={cn(
                "dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl bg-popover p-5 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none sm:p-6",
                wide ? "max-w-xl" : "max-w-lg",
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {icon}
                  <div className="grid min-w-0 gap-0.5">
                    <Dialog.Title className="truncate text-lg font-medium">{label}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {actions}
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                    <X />
                  </Dialog.Close>
                </div>
              </div>
              {details}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

type Layout = "list" | "calendar";

const LAYOUT_COOKIE = "duffle-schedule-layout";

function writeLayout(layout: Layout) {
  document.cookie = `${LAYOUT_COOKIE}=${layout}; path=/; max-age=31536000; samesite=lax`;
}

function monthHeading(days: ScheduleDay[], locale: Locale) {
  const labels = [...new Set(days.map((day) => formatMonthYear(new Date(`${day.date}T00:00:00Z`), locale)))];
  return labels.join(" – ");
}

/** The trip's days split by calendar month, in order. */
function monthsOf(days: ScheduleDay[]) {
  const months: { key: string; days: ScheduleDay[] }[] = [];
  for (const day of days) {
    const key = day.date.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.days.push(day);
    else months.push({ key, days: [day] });
  }
  return months;
}

/**
 * One calendar grid per month, each under its own heading, like a wall calendar. `afterMonth` renders below a
 * month's grid, so the selected day's plans open next to the month it's in.
 */
function CalendarMonths({
  days,
  selectedKey,
  onOpenDay,
  afterMonth,
}: {
  days: ScheduleDay[];
  selectedKey: string | null;
  onOpenDay: (day: ScheduleDay) => void;
  afterMonth: (monthKey: string) => React.ReactNode;
}) {
  return (
    <div className="grid gap-8">
      {monthsOf(days).map((month) => (
        <div key={month.key} className="grid gap-4">
          <div data-layout="calendar">
            <CalendarMonth days={month.days} selectedKey={selectedKey} onOpenDay={onOpenDay} />
          </div>
          {afterMonth(month.key)}
        </div>
      ))}
    </div>
  );
}

function CalendarMonth({
  days,
  selectedKey,
  onOpenDay,
}: {
  days: ScheduleDay[];
  selectedKey: string | null;
  onOpenDay: (day: ScheduleDay) => void;
}) {
  const { today } = useScheduleClock();
  const t = useT("schedule");
  const locale = useLocale();
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (ScheduleDay | null)[] = [...Array.from({ length: lead }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section className="grid gap-3" aria-label={monthHeading(days, locale)}>
      <h2 className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-1 text-base font-semibold backdrop-blur-sm">
        {monthHeading(days, locale)}
      </h2>
      <div className="overflow-x-auto p-1">
        <div className="grid min-w-[52rem] grid-cols-7 gap-2">
          {weekdayNames(locale).map((label) => (
            <div key={label} className="px-1 text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
          {cells.map((day, index) =>
            day ? (
              <section
                key={day.key}
                aria-label={day.key === today ? t("board.openToday", { date: day.dateLabel }) : t("board.openDay", { date: day.dateLabel })}
                aria-current={day.key === today ? "date" : undefined}
                data-today={day.key === today || undefined}
                onClick={(event) => {
                  if (Date.now() < suppressDayOpenUntil) return;
                  // Clicks inside an item's dialog bubble up here through its portal; they aren't on the day.
                  if (!event.currentTarget.contains(event.target as Node)) return;
                  if ((event.target as HTMLElement).closest("[data-schedule-item]")) return;
                  onOpenDay(day);
                }}
                className={cn(
                  "flex min-h-40 min-w-0 scroll-mt-12 cursor-pointer flex-col gap-2 rounded-xl border border-border bg-background p-2 transition-colors hover:border-foreground/25 hover:bg-muted/70",
                  day.key === today &&
                    "border-2 border-primary bg-primary/5 shadow-md shadow-primary/10 hover:border-primary hover:bg-primary/10",
                  selectedKey === day.key && "border-primary bg-muted/60 hover:border-primary",
                )}
              >
                <header className="flex items-center justify-between gap-1">
                  {day.key === today ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {Number(day.date.slice(8, 10))}
                      </span>
                      <span className="text-xs text-primary">{t("board.today")}</span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium">{Number(day.date.slice(8, 10))}</p>
                  )}
                  {day.condition && day.forecast ? (
                    <span title={day.forecast}>
                      <WeatherMark condition={day.condition} className="size-6" />
                    </span>
                  ) : null}
                </header>
                <div className="grid min-w-0 gap-1">{day.content}</div>
              </section>
            ) : (
              <div key={`empty-${index}`} className="min-h-40 rounded-xl border border-border bg-muted/40" />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function ScheduleBoard({
  days,
  timeline,
  initialLayout = "list",
}: {
  days: ScheduleDay[];
  /** Every timed entry, to highlight what's happening now and what's next. */
  timeline: TimelineEntry[];
  initialLayout?: Layout;
}) {
  const tripDays = useMemo<[string, string]>(
    () => [days[0]?.key ?? "", days[days.length - 1]?.key ?? ""],
    [days],
  );
  return (
    <ScheduleClockProvider timeline={timeline} tripDays={tripDays}>
      <Board days={days} initialLayout={initialLayout} />
    </ScheduleClockProvider>
  );
}

function Board({ days, initialLayout }: { days: ScheduleDay[]; initialLayout: Layout }) {
  const { today, states } = useScheduleClock();
  const t = useT("schedule");
  const scrolled = useRef(false);
  const [layout, setLayout] = useState<Layout>(initialLayout);

  // Once the clock is known, bring what's happening now (or next) into view, or else today's day.
  useEffect(() => {
    if (scrolled.current || !today) return;
    const focus =
      layout === "list"
        ? ([...states].find(([, state]) => state?.kind === "current") ??
          [...states].find(([, state]) => state?.kind === "next"))
        : undefined;
    const element = focus
      ? document.querySelector(`[data-time-id="${CSS.escape(focus[0])}"]`)
      : document.querySelector("[data-today]");
    if (!element) return;
    scrolled.current = true;
    element.scrollIntoView({ behavior: "smooth", block: focus || layout === "calendar" ? "center" : "start" });
  }, [today, states, layout]);
  const [selection, setSelection] = useState<{ key: string; tick: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = days.find((day) => day.key === selection?.key) ?? null;

  useEffect(() => {
    if (!selection || layout !== "calendar") return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selection, layout]);

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg bg-muted p-[3px]" role="group" aria-label={t("board.layout")}>
          {(
            [
              ["list", List, t("board.list")],
              ["calendar", CalendarDays, t("board.calendar")],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={layout === value}
              onClick={() => {
                writeLayout(value);
                setLayout(value);
              }}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
                layout === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {layout === "list" ? (
        <div className="grid gap-4">
          {days.map((day) => (
            <DaySection
              key={day.key}
              dateLabel={day.dateLabel}
              condition={day.condition}
              forecast={day.forecast}
              today={day.key === today}
            >
              {day.content}
            </DaySection>
          ))}
        </div>
      ) : (
        <CalendarMonths
          days={days}
          selectedKey={selection?.key ?? null}
          onOpenDay={(day) => setSelection((current) => ({ key: day.key, tick: (current?.tick ?? 0) + 1 }))}
          afterMonth={(monthKey) =>
            selected && selected.date.startsWith(monthKey) ? (
              <div ref={panelRef} className="scroll-mt-12">
                <DaySection
                  dateLabel={selected.dateLabel}
                  condition={selected.condition}
                  forecast={selected.forecast}
                  today={selected.key === today}
                >
                  {selected.content}
                </DaySection>
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}
