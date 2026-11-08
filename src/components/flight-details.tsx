"use client";

import { Armchair, Clock, Hourglass, Plane, RefreshCw, Users, Wallet } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { MemberTag } from "@/components/member-tag";
import { ConfirmationRow, DetailList, DetailRow, DirectionsSection, NotesRow } from "@/components/plan-details";
import type { AirportInfo } from "@/lib/airports";
import { formatDateLong, formatDateShort, formatTime } from "@/lib/dates";
import { formatMinutes, terminalLabel } from "@/lib/flight-lookup";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type FlightDetailsData = {
  airline: string;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  /** Name, city and country of each airport, looked up on the server (the airport list is large). */
  fromInfo: AirportInfo | null;
  toInfo: AirportInfo | null;
  fromTerminal: string | null;
  toTerminal: string | null;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
  /** Local wall-clock times at each airport, stored as UTC. */
  departAt: Date;
  arriveAt: Date;
  durationMinutes: number | null;
  confirmation: string | null;
  /** Seat numbers, ["14A", "14B"]. */
  seats: string[];
  notes: string | null;
  checkedAt: Date | null;
  travelers: { userId: string; name: string; imageKey: string | null }[];
  /** The linked expense, already formatted ("€420.00"). */
  cost: string | null;
  /** Days the arrival lands after the departure date: 1 overnight, -1 across the date line. */
  dayOffset: number;
  /** The earlier flight this one connects from, if any. */
  connection: { label: string; minutes: number; sameNumber: boolean } | null;
};

function Endpoint({
  code,
  airport,
  time,
  date,
  terminal,
  align,
  offset = 0,
}: {
  code: string;
  airport: AirportInfo | null;
  time: Date;
  date: Date;
  terminal: string | null;
  align: "start" | "end";
  offset?: number;
}) {
  const locale = useLocale();
  return (
    <div className={cn("grid min-w-0 gap-1", align === "end" ? "justify-items-end text-end" : "justify-items-start")}>
      <p className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">{code}</p>
      {airport ? (
        <p className={cn("flex max-w-full items-center gap-1.5 text-sm font-medium", align === "end" && "flex-row-reverse")}>
          <CountryFlag code={airport.country} className="shrink-0" />
          <span className="truncate">{airport.city}</span>
        </p>
      ) : null}
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {formatTime(time)}
        {offset !== 0 ? (
          <sup className="ms-0.5 text-xs font-medium text-primary">{offset > 0 ? `+${offset}` : offset}</sup>
        ) : null}
      </p>
      <p className="text-xs text-muted-foreground">{formatDateShort(date, locale)}</p>
      {terminal ? (
        <span className="mt-1 rounded-md bg-background px-2 py-0.5 text-xs font-medium ring-1 ring-foreground/10">
          {terminalLabel(terminal, locale)}
        </span>
      ) : null}
      {airport ? <p className="line-clamp-2 text-xs text-muted-foreground">{airport.name}</p> : null}
    </div>
  );
}

/** Everything about one flight, for the dialog that opens from the schedule. */
export function FlightDetails({ flight }: { flight: FlightDetailsData }) {
  const { connection } = flight;
  const t = useT("schedule");
  const tCommon = useT("common");
  const locale = useLocale();
  const strong = (chunks: React.ReactNode) => <strong className="font-medium">{chunks}</strong>;

  return (
    <div className="grid gap-5">
      <section
        aria-label={t("flight.route", { from: flight.fromAirport, to: flight.toAirport })}
        className="rounded-xl bg-muted/60 p-4 ring-1 ring-foreground/10 sm:p-5"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
          <Endpoint
            code={flight.fromAirport}
            airport={flight.fromInfo}
            time={flight.departAt}
            date={flight.departAt}
            terminal={flight.fromTerminal}
            align="start"
          />
          <div className="flex w-16 flex-col items-center gap-1.5 pt-3 sm:w-28" aria-hidden>
            <div className="flex w-full items-center gap-1 text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-current" />
              <span className="h-px flex-1 border-t border-dashed border-current" />
              <Plane className="size-4 shrink-0 text-primary" />
              <span className="h-px flex-1 border-t border-dashed border-current" />
              <span className="size-1.5 shrink-0 rounded-full bg-current" />
            </div>
            {flight.durationMinutes ? (
              <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
                {formatMinutes(flight.durationMinutes, locale)}
              </span>
            ) : null}
          </div>
          <Endpoint
            code={flight.toAirport}
            airport={flight.toInfo}
            time={flight.arriveAt}
            date={flight.arriveAt}
            terminal={flight.toTerminal}
            align="end"
            offset={flight.dayOffset}
          />
        </div>
        {flight.dayOffset !== 0 ? (
          <p className="mt-4 border-t border-dashed border-foreground/15 pt-3 text-xs text-muted-foreground">
            {flight.dayOffset > 0
              ? flight.dayOffset === 1
                ? t("flight.landsNext", { date: formatDateLong(flight.arriveAt, locale) })
                : t("flight.landsLater", { count: flight.dayOffset, date: formatDateLong(flight.arriveAt, locale) })
              : t("flight.landsBefore", { date: formatDateLong(flight.arriveAt, locale) })}{" "}
            {t("flight.localNote")}
          </p>
        ) : (
          <p className="mt-4 border-t border-dashed border-foreground/15 pt-3 text-xs text-muted-foreground">
            {t("flight.localNote")}
          </p>
        )}
      </section>

      {connection ? (
        <p className="flex items-start gap-2.5 rounded-lg bg-primary/10 px-3 py-2.5 text-sm">
          <Hourglass className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {connection.sameNumber
              ? t.rich("flight.continuesStop", {
                  duration: formatMinutes(connection.minutes, locale),
                  airport: flight.fromAirport,
                  b: strong,
                })
              : t.rich("flight.connectsFrom", {
                  flight: connection.label,
                  duration: formatMinutes(connection.minutes, locale),
                  airport: flight.fromAirport,
                  b: strong,
                })}
          </span>
        </p>
      ) : null}

      <DetailList>
        <ConfirmationRow code={flight.confirmation} />
        <DetailRow icon={Armchair} label={t("flight.seats", { count: flight.seats.length === 1 ? 1 : 2 })}>
          {flight.seats.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {flight.seats.map((seat) => (
                <span
                  key={seat}
                  className="rounded-md bg-sky-100 px-2 py-0.5 font-mono text-sm font-semibold tracking-wide text-sky-950 dark:bg-sky-950 dark:text-sky-100"
                >
                  {seat}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{tCommon("notAdded")}</span>
          )}
        </DetailRow>
        <DetailRow icon={Clock} label={t("flight.flightTime")}>
          {flight.durationMinutes ? (
            formatMinutes(flight.durationMinutes, locale)
          ) : (
            <span className="text-muted-foreground">{t("flight.unknown")}</span>
          )}
        </DetailRow>
        <DetailRow icon={Users} label={t("flight.travelers", { count: flight.travelers.length === 1 ? 1 : 2 })}>
          {flight.travelers.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5">
              {flight.travelers.map((traveler) => (
                <MemberTag key={traveler.userId} userId={traveler.userId} name={traveler.name} imageKey={traveler.imageKey} />
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("flight.noOne")}</span>
          )}
        </DetailRow>
        {flight.cost ? (
          <DetailRow icon={Wallet} label={t("details.cost")}>
            {flight.cost}
          </DetailRow>
        ) : null}
        <NotesRow notes={flight.notes} />
      </DetailList>

      <DirectionsSection
        title={t("flight.gettingToAirports")}
        places={[
          {
            label: t("page.toAirport", { airport: flight.fromAirport }),
            place: { name: t("page.airportName", { airport: flight.fromAirport }), lat: flight.fromLat, lng: flight.fromLng },
          },
          {
            label: t("page.toAirport", { airport: flight.toAirport }),
            place: { name: t("page.airportName", { airport: flight.toAirport }), lat: flight.toLat, lng: flight.toLng },
          },
        ]}
      />

      {flight.checkedAt ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="size-3" />
          {t("flight.checked", { date: formatDateShort(flight.checkedAt, locale) })}
        </p>
      ) : null}
    </div>
  );
}
