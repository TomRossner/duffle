"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays, List, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DaySection } from "@/components/day-editor";
import { buttonVariants } from "@/components/ui/button";
import { WeatherMark } from "@/components/weather-mark";
import { cn } from "@/lib/utils";

export type ScheduleDay = {
  key: string;
  date: string;
  dateLabel: string;
  condition: string | null;
  forecast: string | null;
  content: React.ReactNode;
  detail: React.ReactNode;
};

let suppressDayOpenUntil = 0;

function suppressDayOpen() {
  suppressDayOpenUntil = Date.now() + 400;
}

export function ScheduleItem({
  label,
  details,
  children,
}: {
  label: string;
  details: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        data-schedule-item
        className="min-w-0"
        onMouseDown={(event) => {
          if (event.currentTarget.closest("[data-layout]")?.getAttribute("data-layout") !== "calendar") return;
          event.stopPropagation();
        }}
        onClick={(event) => {
          if (event.currentTarget.closest("[data-layout]")?.getAttribute("data-layout") !== "calendar") return;
          event.stopPropagation();
          suppressDayOpen();
          const target = event.target as HTMLElement;
          if (target.closest("button, a, [role=menu], [role=menuitem]")) return;
          setOpen(true);
        }}
      >
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
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-medium">{label}</Dialog.Title>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
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
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function writeLayout(layout: Layout) {
  document.cookie = `${LAYOUT_COOKIE}=${layout}; path=/; max-age=31536000; samesite=lax`;
}

function monthHeading(days: ScheduleDay[]) {
  const format = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
  const labels = [...new Set(days.map((day) => format.format(new Date(`${day.date}T00:00:00Z`))))];
  return labels.join(" – ");
}

function CalendarGrid({
  days,
  selectedKey,
  onOpenDay,
}: {
  days: ScheduleDay[];
  selectedKey: string | null;
  onOpenDay: (day: ScheduleDay) => void;
}) {
  if (days.length === 0) return null;
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (ScheduleDay | null)[] = [...Array.from({ length: lead }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid gap-3">
      <h2 className="text-sm font-medium">{monthHeading(days)}</h2>
      <div className="overflow-x-auto p-1">
        <div className="grid min-w-[52rem] grid-cols-7 gap-2">
          {WEEKDAYS.map((label) => (
            <div key={label} className="px-1 text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
          {cells.map((day, index) =>
            day ? (
              <section
                key={day.key}
                aria-label={`Open ${day.dateLabel}`}
                onClick={(event) => {
                  if (Date.now() < suppressDayOpenUntil) return;
                  if ((event.target as HTMLElement).closest("[data-schedule-item]")) return;
                  onOpenDay(day);
                }}
                className={cn(
                  "flex min-h-40 min-w-0 cursor-pointer flex-col gap-2 rounded-xl border border-border bg-background p-2 transition-colors hover:border-foreground/25 hover:bg-muted/70",
                  selectedKey === day.key && "border-primary bg-muted/60 hover:border-primary",
                )}
              >
                <header className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium">{Number(day.date.slice(8, 10))}</p>
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
    </div>
  );
}

export function ScheduleBoard({ days, initialLayout = "list" }: { days: ScheduleDay[]; initialLayout?: Layout }) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
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
        <div className="inline-flex rounded-lg bg-muted p-[3px]" role="group" aria-label="Schedule layout">
          {(
            [
              ["list", List, "List"],
              ["calendar", CalendarDays, "Calendar"],
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
            <DaySection key={day.key} dateLabel={day.dateLabel} condition={day.condition} forecast={day.forecast}>
              {day.detail}
            </DaySection>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <div data-layout="calendar">
            <CalendarGrid
              days={days}
              selectedKey={selection?.key ?? null}
              onOpenDay={(day) => setSelection((current) => ({ key: day.key, tick: (current?.tick ?? 0) + 1 }))}
            />
          </div>
          {selected ? (
            <div ref={panelRef} className="scroll-mt-6">
              <DaySection dateLabel={selected.dateLabel} condition={selected.condition} forecast={selected.forecast}>
                {selected.detail}
              </DaySection>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
