import { cookies } from "next/headers";
import { CalendarDays } from "lucide-react";
import { AddPlanButton, AddPlanProvider } from "@/components/add-plan";
import { AirlineLogo } from "@/components/airline-logo";
import { EmptyState } from "@/components/empty-state";
import { FlightDetails } from "@/components/flight-details";
import {
  PlanDetails,
  PlanIconTile,
  StayDetails,
} from "@/components/plan-details";
import { getT } from "@/i18n/server";
import { DirectionsButton } from "@/components/place-links";
import type { PlaceTarget } from "@/lib/place-links";
import {
  ActivityEditor,
  PlanEditor,
  ScheduleItemMenu,
} from "@/components/day-editor";
import { MemberTag } from "@/components/member-tag";
import {
  FlightEditor,
  PlanForm,
  PlanTag,
  StayEditor,
} from "@/components/plan-form";
import { airportInfo } from "@/lib/airports";
import { ScheduleBoard, ScheduleItem } from "@/components/schedule-board";
import type { TimelineEntry } from "@/components/schedule-clock";
import { deleteActivity } from "@/lib/actions/destinations";
import {
  deleteFlight,
  deleteScheduleItem,
  deleteStay,
} from "@/lib/actions/schedule";
import { dateKey, eachDate, formatDateLong, formatTime } from "@/lib/dates";
import {
  airlineCodeOf,
  dayOffset,
  formatMinutes,
  MAX_CONNECTION_MINUTES,
  minutesBetween,
  seatList,
  terminalLabel,
} from "@/lib/flight-lookup";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { formatMoney } from "@/lib/utils";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const layoutCookie = (await cookies()).get("duffle-schedule-layout")?.value;
  const initialLayout = layoutCookie === "calendar" ? "calendar" : "list";
  const { trip } = await requireTrip(tripId);
  const t = await getT("schedule");
  const tCommon = await getT("common");
  const tLabels = await getT("labels");
  const locale = t.locale;
  const [members, destinations, flights, stays, items, weatherDays] =
    await Promise.all([
      acceptedMembers(tripId),
      prisma.destination.findMany({
        where: { tripId },
        include: {
          activities: {
            include: { expense: { select: { amount: true, currency: true } } },
          },
        },
        orderBy: [
          { startDate: "asc" },
          { endDate: "asc" },
          { sortOrder: "asc" },
        ],
      }),
      prisma.flight.findMany({
        where: { tripId },
        include: {
          travelers: { include: { user: true } },
          expense: { select: { amount: true, currency: true } },
        },
        orderBy: { departAt: "asc" },
      }),
      prisma.stay.findMany({
        where: { tripId },
        include: { expense: { select: { amount: true, currency: true } } },
        orderBy: { checkIn: "asc" },
      }),
      prisma.scheduleItem.findMany({
        where: { tripId },
        orderBy: { startAt: "asc" },
      }),
      prisma.weatherDay.findMany({ where: { destination: { tripId } } }),
    ]);

  const flightLookup = Boolean(process.env.AERODATABOX_API_KEY);
  // Flight times are stored as each airport's local wall-clock time, so "YYYY-MM-DDTHH:mm" is that local time.
  const localTime = (date: Date) => date.toISOString().slice(0, 16);
  // A flight connects from an earlier one that lands at its departure airport within a day. Both times
  // are local to that airport, so the gap between them is the real layover.
  const connections = new Map<
    string,
    { from: (typeof flights)[number]; minutes: number }
  >();
  for (const flight of flights) {
    const from = flights
      .filter(
        (other) =>
          other.id !== flight.id && other.toAirport === flight.fromAirport,
      )
      .map((other) => ({
        from: other,
        minutes: minutesBetween(
          localTime(other.arriveAt),
          localTime(flight.departAt),
        ),
      }))
      .filter(
        (option) =>
          option.minutes >= 0 && option.minutes <= MAX_CONNECTION_MINUTES,
      )
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (from) connections.set(flight.id, from);
  }

  const people = members.map((member) => ({
    id: member.userId,
    label: (
      <MemberTag
        userId={member.userId}
        name={member.user.name}
        imageKey={member.user.imageKey}
      />
    ),
  }));
  // One array shared by every form, so the page sends it once.
  const destinationOptions = destinations.map((destination) => ({
    id: destination.id,
    name: destination.name,
  }));
  const days = eachDate(trip.startDate, trip.endDate);
  const tripDays = days.map(dateKey);

  // Days each repeating plan/activity is on, so its edit form can show (and manage) all of them.
  const seriesDays = new Map<string, string[]>();
  const addSeriesDay = (seriesId: string | null, startAt: Date | null) => {
    if (!seriesId || !startAt) return;
    seriesDays.set(seriesId, [
      ...(seriesDays.get(seriesId) ?? []),
      dateKey(startAt),
    ]);
  };
  for (const item of items) addSeriesDay(item.seriesId, item.startAt);
  for (const destination of destinations) {
    for (const activity of destination.activities)
      addSeriesDay(activity.seriesId, activity.startAt);
  }
  const otherSeriesDays = (seriesId: string | null, startAt: Date | null) =>
    seriesId && startAt
      ? (seriesDays.get(seriesId) ?? []).filter(
          (day) => day !== dateKey(startAt),
        )
      : [];
  const itemClass =
    // Wraps so the place buttons (basis-full, after the menu) get their own full-width row under the text and menu.
    "schedule-item flex flex-wrap items-start justify-between gap-x-3 in-data-[layout=calendar]:flex-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-sm in-data-[layout=calendar]:items-center in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:rounded-md in-data-[layout=calendar]:relative in-data-[layout=calendar]:w-full in-data-[layout=calendar]:min-w-0 in-data-[layout=calendar]:overflow-hidden in-data-[layout=calendar]:cursor-pointer in-data-[layout=calendar]:py-1 in-data-[layout=calendar]:pe-6 in-data-[layout=calendar]:ps-1.5 in-data-[layout=calendar]:text-xs in-data-[layout=calendar]:transition-colors in-data-[layout=calendar]:hover:border-foreground/30 in-data-[layout=calendar]:hover:bg-background in-data-[layout=calendar]:hover:shadow-sm";
  // Every card opens its details dialog, so it reads as clickable in the list too.
  const cardClass = `${itemClass} cursor-pointer transition-colors hover:border-foreground/30 hover:shadow-sm`;
  const costOf = (expense: { amount: unknown; currency: string } | null) =>
    expense ? formatMoney(Number(expense.amount), expense.currency, locale) : null;
  const destinationName = (id: string | null) =>
    destinations.find((destination) => destination.id === id)?.name ?? null;
  const detailClass = "in-data-[layout=calendar]:hidden";

  // Every timed entry, so the board can highlight what's happening now and what's next. The ids match each
  // ScheduleItem's timeId.
  const plusMinutes = (date: Date, minutes: number) =>
    new Date(date.getTime() + minutes * 60_000);
  const timeline: TimelineEntry[] = [
    ...flights.map((flight) => ({
      id: `flight-${flight.id}`,
      start: localTime(flight.departAt),
      // The arrival is in another time zone, so the flying time gives the real end when it's known.
      end: localTime(
        flight.durationMinutes
          ? plusMinutes(flight.departAt, flight.durationMinutes)
          : flight.arriveAt,
      ),
      allDay: false,
    })),
    ...stays.flatMap((stay) => [
      {
        id: `stay-${stay.id}-in`,
        start: localTime(stay.checkIn),
        end: null,
        allDay: false,
      },
      {
        id: `stay-${stay.id}-out`,
        start: localTime(stay.checkOut),
        end: null,
        allDay: false,
      },
    ]),
    ...destinations.flatMap((destination) =>
      destination.activities.flatMap((activity) =>
        activity.startAt
          ? [
              {
                id: `activity-${activity.id}`,
                start: localTime(activity.startAt),
                end: activity.endAt ? localTime(activity.endAt) : null,
                allDay: activity.allDay,
              },
            ]
          : [],
      ),
    ),
    ...items.map((item) => ({
      id: `item-${item.id}`,
      start: localTime(item.startAt),
      end: item.endAt ? localTime(item.endAt) : null,
      allDay: item.allDay,
    })),
  ];
  // The directions icon beside a card's menu. The full Maps and directions buttons are in its details dialog,
  // and calendar cells are too small for an extra button.
  const cardActions = (
    places: { label?: string; place: PlaceTarget }[],
    menu: React.ReactNode,
  ) => (
    <div className="flex shrink-0 items-center gap-0.5">
      <DirectionsButton places={places} className={detailClass} />
      {menu}
    </div>
  );
  const titleClass =
    "flex w-full min-w-0 flex-wrap items-center gap-2 font-medium in-data-[layout=calendar]:flex-nowrap in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:overflow-hidden";

  return (
    <div className="grid gap-6">
      <PlanForm
        tripId={tripId}
        currency={trip.baseCurrency}
        people={people}
        destinations={destinationOptions}
        tripDays={tripDays}
        flightLookup={flightLookup}
      />

      {flights.length +
        stays.length +
        items.length +
        destinations.reduce(
          (sum, destination) => sum + destination.activities.length,
          0,
        ) ===
      0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("page.emptyTitle")}
          compact
        >
          {t("page.emptyBody")}
        </EmptyState>
      ) : null}

      <AddPlanProvider
        tripId={tripId}
        currency={trip.baseCurrency}
        people={people}
        destinations={destinationOptions}
        tripDays={tripDays}
        flightLookup={flightLookup}
      >
        <ScheduleBoard
          initialLayout={initialLayout}
          timeline={timeline}
          days={days.map((day) => {
            const key = dateKey(day);
            const weather = weatherDays.find(
              (entry) => dateKey(entry.date) === key,
            );
            const dayFlights = flights.filter(
              (flight) => dateKey(flight.departAt) === key,
            );
            const dayStays = stays.filter(
              (stay) =>
                dateKey(stay.checkIn) === key || dateKey(stay.checkOut) === key,
            );
            const dayItems = items.filter(
              (item) => dateKey(item.startAt) === key,
            );
            const dayActivities = destinations.flatMap((destination) =>
              destination.activities
                .filter(
                  (activity) =>
                    activity.startAt && dateKey(activity.startAt) === key,
                )
                .map((activity) => ({
                  ...activity,
                  place: destination.name,
                  target:
                    activity.lat != null && activity.lng != null
                      ? {
                          name: activity.title,
                          placeId: activity.placeId,
                          lat: activity.lat,
                          lng: activity.lng,
                        }
                      : {
                          name: destination.name,
                          address: destination.address,
                          placeId: destination.placeId,
                          lat: destination.lat,
                          lng: destination.lng,
                        },
                })),
            );
            const empty =
              dayFlights.length +
                dayStays.length +
                dayItems.length +
                dayActivities.length ===
              0;

            const content = (
              <>
                {empty ? (
                  <p
                    className={`flex items-center gap-2 text-sm text-muted-foreground ${detailClass}`}
                  >
                    <CalendarDays className="size-4" />
                    {t("page.nothingPlanned")}
                  </p>
                ) : null}
                {[
                  ...dayFlights.map((flight) => {
                    const connection = connections.get(flight.id);
                    const overnight = dayOffset(
                      localTime(flight.departAt),
                      localTime(flight.arriveAt),
                    );
                    const flightLabel = `${flight.airline} ${flight.flightNumber}`;
                    const menu = (
                      <ScheduleItemMenu
                        label={flightLabel}
                        confirmMessage={tCommon("confirmRemove", { name: flightLabel })}
                        remove={deleteFlight.bind(null, tripId, flight.id)}
                      >
                        <FlightEditor
                          tripId={tripId}
                          people={people}
                          lookup={flightLookup}
                          flight={{
                            id: flight.id,
                            airline: flight.airline,
                            flightNumber: flight.flightNumber,
                            fromAirport: flight.fromAirport,
                            toAirport: flight.toAirport,
                            fromTerminal: flight.fromTerminal ?? "",
                            toTerminal: flight.toTerminal ?? "",
                            durationMinutes: flight.durationMinutes,
                            departAt: localTime(flight.departAt),
                            arriveAt: localTime(flight.arriveAt),
                            confirmation: flight.confirmation ?? "",
                            seats: flight.seats ?? "",
                            notes: flight.notes ?? "",
                            travelerIds: flight.travelers.map(
                              (traveler) => traveler.userId,
                            ),
                          }}
                        />
                      </ScheduleItemMenu>
                    );
                    const card = (
                      <div className={cardClass}>
                        <div className="min-w-0 flex-1">
                          <p className={titleClass}>
                            <PlanTag kind="FLIGHT" />
                            <AirlineLogo
                              code={airlineCodeOf(flight.flightNumber)}
                              className="in-data-[layout=calendar]:hidden"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {formatTime(flight.departAt)} {flight.airline}{" "}
                              {flight.flightNumber}
                            </span>
                          </p>
                          <p className={`text-muted-foreground ${detailClass}`}>
                            <span className="font-mono">
                              {flight.fromAirport}
                            </span>
                            {flight.fromTerminal
                              ? ` (${terminalLabel(flight.fromTerminal, locale)})`
                              : ""}{" "}
                            →{" "}
                            <span className="font-mono">
                              {flight.toAirport}
                            </span>
                            {flight.toTerminal
                              ? ` (${terminalLabel(flight.toTerminal, locale)})`
                              : ""}
                            {t("page.arrives", { time: formatTime(flight.arriveAt) })}
                            {overnight !== 0 ? (
                              <sup className="ms-0.5">
                                {overnight > 0 ? `+${overnight}` : overnight}
                              </sup>
                            ) : null}
                            {flight.durationMinutes
                              ? ` · ${formatMinutes(flight.durationMinutes, locale)}`
                              : ""}
                            {flight.confirmation
                              ? ` · ${flight.confirmation}`
                              : ""}
                            {flight.seats ? ` · ${t("page.seats", { seats: flight.seats })}` : ""}
                          </p>
                          {connection ? (
                            <p
                              className={`text-xs text-muted-foreground ${detailClass}`}
                            >
                              {connection.from.flightNumber ===
                              flight.flightNumber
                                ? // The same number flying on: a stop, not a change of plane booked separately.
                                  t("page.continues", {
                                    flight: `${flight.airline} ${flight.flightNumber}`,
                                    duration: formatMinutes(connection.minutes, locale),
                                    airport: flight.fromAirport,
                                  })
                                : t("page.connects", {
                                    flight: `${connection.from.airline} ${connection.from.flightNumber}`,
                                    duration: formatMinutes(connection.minutes, locale),
                                    airport: flight.fromAirport,
                                  })}
                            </p>
                          ) : null}
                          {flight.travelers.length > 0 ? (
                            <p
                              className={`mt-1 flex flex-wrap gap-2 ${detailClass}`}
                            >
                              {flight.travelers.map((traveler) => (
                                <MemberTag
                                  key={traveler.userId}
                                  userId={traveler.userId}
                                  name={traveler.user.name}
                                  imageKey={traveler.user.imageKey}
                                />
                              ))}
                            </p>
                          ) : null}
                        </div>
                        {cardActions(
                          [
                            {
                              label: t("page.toAirport", { airport: flight.fromAirport }),
                              place: {
                                name: t("page.airportName", { airport: flight.fromAirport }),
                                lat: flight.fromLat,
                                lng: flight.fromLng,
                              },
                            },
                            {
                              label: t("page.toAirport", { airport: flight.toAirport }),
                              place: {
                                name: t("page.airportName", { airport: flight.toAirport }),
                                lat: flight.toLat,
                                lng: flight.toLng,
                              },
                            },
                          ],
                          menu,
                        )}
                      </div>
                    );
                    return {
                      at: flight.departAt.getTime(),
                      node: (
                        <ScheduleItem
                          key={flight.id}
                          timeId={`flight-${flight.id}`}
                          label={flightLabel}
                          opensInList
                          wide
                          icon={
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-foreground/10">
                              <AirlineLogo
                                code={airlineCodeOf(flight.flightNumber)}
                                className="size-7"
                              />
                            </span>
                          }
                          description={t("page.flightDescription", {
                            date: formatDateLong(flight.departAt, locale),
                            from: flight.fromAirport,
                            to: flight.toAirport,
                          })}
                          actions={menu}
                          details={
                            <FlightDetails
                              flight={{
                                airline: flight.airline,
                                flightNumber: flight.flightNumber,
                                fromAirport: flight.fromAirport,
                                toAirport: flight.toAirport,
                                fromInfo: airportInfo(flight.fromAirport),
                                toInfo: airportInfo(flight.toAirport),
                                fromTerminal: flight.fromTerminal,
                                toTerminal: flight.toTerminal,
                                fromLat: flight.fromLat,
                                fromLng: flight.fromLng,
                                toLat: flight.toLat,
                                toLng: flight.toLng,
                                departAt: flight.departAt,
                                arriveAt: flight.arriveAt,
                                durationMinutes: flight.durationMinutes,
                                confirmation: flight.confirmation,
                                seats: seatList(flight.seats),
                                notes: flight.notes,
                                checkedAt: flight.checkedAt,
                                travelers: flight.travelers.map((traveler) => ({
                                  userId: traveler.userId,
                                  name: traveler.user.name,
                                  imageKey: traveler.user.imageKey,
                                })),
                                cost: costOf(flight.expense),
                                dayOffset: overnight,
                                connection: connection
                                  ? {
                                      label: `${connection.from.airline} ${connection.from.flightNumber}`,
                                      minutes: connection.minutes,
                                      sameNumber:
                                        connection.from.flightNumber ===
                                        flight.flightNumber,
                                    }
                                  : null,
                              }}
                            />
                          }
                        >
                          {card}
                        </ScheduleItem>
                      ),
                    };
                  }),
                  ...dayStays.map((stay) => {
                    const menu = (
                      <ScheduleItemMenu
                        label={stay.name}
                        confirmMessage={tCommon("confirmRemove", { name: stay.name })}
                        remove={deleteStay.bind(null, tripId, stay.id)}
                      >
                        <StayEditor
                          tripId={tripId}
                          destinations={destinationOptions}
                          stay={{
                            id: stay.id,
                            name: stay.name,
                            address: stay.address ?? "",
                            destinationId: stay.destinationId ?? "",
                            confirmation: stay.confirmation ?? "",
                            notes: stay.notes ?? "",
                            checkIn: stay.checkIn.toISOString().slice(0, 16),
                            checkOut: stay.checkOut.toISOString().slice(0, 16),
                          }}
                        />
                      </ScheduleItemMenu>
                    );
                    const card = (
                      <div className={cardClass}>
                        <div className="min-w-0 flex-1">
                          <p className={titleClass}>
                            <PlanTag kind="STAY" />
                            <span className="min-w-0 flex-1 truncate">
                              <span className="hidden in-data-[layout=calendar]:inline">
                                {formatTime(
                                  dateKey(stay.checkIn) === key
                                    ? stay.checkIn
                                    : stay.checkOut,
                                )}{" "}
                              </span>
                              {dateKey(stay.checkIn) === key
                                ? t("page.checkIn")
                                : t("page.checkOut")}{" "}
                              · {stay.name}
                            </span>
                          </p>
                          <p className={`text-muted-foreground ${detailClass}`}>
                            {formatTime(
                              dateKey(stay.checkIn) === key
                                ? stay.checkIn
                                : stay.checkOut,
                            )}
                            {stay.address ? ` · ${stay.address}` : ""}
                          </p>
                        </div>
                        {cardActions(
                          [
                            {
                              place: {
                                name: stay.name,
                                address: stay.address,
                                lat: stay.lat,
                                lng: stay.lng,
                              },
                            },
                          ],
                          menu,
                        )}
                      </div>
                    );
                    const checkingIn = dateKey(stay.checkIn) === key;
                    const stayDestination = destinationName(stay.destinationId);
                    return {
                      at: (checkingIn ? stay.checkIn : stay.checkOut).getTime(),
                      node: (
                        <ScheduleItem
                          key={`${stay.id}-${key}`}
                          timeId={`stay-${stay.id}-${checkingIn ? "in" : "out"}`}
                          label={stay.name}
                          opensInList
                          wide
                          icon={<PlanIconTile kind="STAY" />}
                          description={`${checkingIn ? t("page.checkIn") : t("page.checkOut")} · ${formatDateLong(checkingIn ? stay.checkIn : stay.checkOut, locale)}`}
                          actions={menu}
                          details={
                            <StayDetails
                              stay={{
                                name: stay.name,
                                address: stay.address,
                                destination: stayDestination,
                                lat: stay.lat,
                                lng: stay.lng,
                                checkIn: stay.checkIn,
                                checkOut: stay.checkOut,
                                confirmation: stay.confirmation,
                                notes: stay.notes,
                                cost: costOf(stay.expense),
                              }}
                            />
                          }
                        >
                          {card}
                        </ScheduleItem>
                      ),
                    };
                  }),
                  ...dayActivities.map((activity) => {
                    const menu = (
                      <ScheduleItemMenu
                        label={activity.title}
                        confirmMessage={tCommon("confirmRemove", { name: activity.title })}
                        remove={deleteActivity.bind(null, tripId, activity.id)}
                      >
                        <ActivityEditor
                          tripId={tripId}
                          tripDays={tripDays}
                          activity={{
                            id: activity.id,
                            title: activity.title,
                            notes: activity.notes ?? "",
                            startAt: activity.startAt
                              ? activity.startAt.toISOString().slice(0, 16)
                              : "",
                            endAt: activity.endAt
                              ? activity.endAt.toISOString().slice(0, 16)
                              : "",
                            allDay: activity.allDay,
                            seriesDays: otherSeriesDays(
                              activity.seriesId,
                              activity.startAt,
                            ),
                          }}
                        />
                      </ScheduleItemMenu>
                    );
                    const card = (
                      <div className={cardClass}>
                        <div className="min-w-0 flex-1">
                          <p className={titleClass}>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              <span className="hidden in-data-[layout=calendar]:inline">
                                {activity.startAt && !activity.allDay
                                  ? `${formatTime(activity.startAt)} `
                                  : ""}
                              </span>
                              {activity.title}
                            </span>
                          </p>
                          <p className={`text-muted-foreground ${detailClass}`}>
                            {activity.place}
                            {activity.allDay
                              ? ` · ${t("page.allDay")}`
                              : activity.startAt
                                ? ` · ${formatTime(activity.startAt)}${activity.endAt ? `–${formatTime(activity.endAt)}` : ""}`
                                : ""}
                          </p>
                        </div>
                        {cardActions([{ place: activity.target }], menu)}
                      </div>
                    );
                    // The filter above keeps only activities with a start time.
                    const startAt = activity.startAt!;
                    return {
                      at: activity.allDay ? 0 : startAt.getTime(),
                      node: (
                        <ScheduleItem
                          key={activity.id}
                          timeId={`activity-${activity.id}`}
                          label={activity.title}
                          opensInList
                          wide
                          icon={
                            <PlanIconTile
                              kind="ACTIVITY"
                              className="bg-primary/10 text-primary"
                            />
                          }
                          description={t("page.activityIn", { place: activity.place, date: formatDateLong(startAt, locale) })}
                          actions={menu}
                          details={
                            <PlanDetails
                              plan={{
                                start: startAt,
                                end: activity.endAt,
                                allDay: activity.allDay,
                                placeName: null,
                                destination: activity.place,
                                tags: activity.tags,
                                seriesDays: otherSeriesDays(
                                  activity.seriesId,
                                  activity.startAt,
                                ),
                                cost: costOf(activity.expense),
                                notes: activity.notes,
                                place: activity.target,
                              }}
                            />
                          }
                        >
                          {card}
                        </ScheduleItem>
                      ),
                    };
                  }),
                  ...dayItems.map((item) => {
                    const menu = (
                      <ScheduleItemMenu
                        label={item.title}
                        confirmMessage={tCommon("confirmRemove", { name: item.title })}
                        remove={deleteScheduleItem.bind(null, tripId, item.id)}
                      >
                        <PlanEditor
                          tripId={tripId}
                          tripDays={tripDays}
                          plan={{
                            id: item.id,
                            title: item.title,
                            kind: item.kind,
                            startAt: item.startAt.toISOString().slice(0, 16),
                            endAt: item.endAt
                              ? item.endAt.toISOString().slice(0, 16)
                              : "",
                            allDay: item.allDay,
                            seriesDays: otherSeriesDays(
                              item.seriesId,
                              item.startAt,
                            ),
                            placeName: item.placeName ?? "",
                            notes: item.notes ?? "",
                          }}
                        />
                      </ScheduleItemMenu>
                    );
                    const itemPlace =
                      item.placeName || (item.lat != null && item.lng != null)
                        ? {
                            name: item.placeName || item.title,
                            lat: item.lat,
                            lng: item.lng,
                          }
                        : null;
                    const card = (
                      <div className={cardClass}>
                        <div className="min-w-0 flex-1">
                          <p className={titleClass}>
                            <PlanTag kind={item.kind} />
                            <span className="min-w-0 flex-1 truncate">
                              {item.allDay ? (
                                <span
                                  className={`me-1.5 rounded bg-background px-1.5 py-0.5 text-xs font-normal text-muted-foreground ${detailClass}`}
                                >
                                  {t("page.allDay")}
                                </span>
                              ) : (
                                `${formatTime(item.startAt)}${item.endAt ? `–${formatTime(item.endAt)}` : ""} `
                              )}
                              {item.title}
                            </span>
                          </p>
                          {item.placeName ? (
                            <p
                              className={`text-muted-foreground ${detailClass}`}
                            >
                              {item.placeName}
                            </p>
                          ) : null}
                        </div>
                        {cardActions(
                          itemPlace ? [{ place: itemPlace }] : [],
                          menu,
                        )}
                      </div>
                    );
                    return {
                      at: item.allDay ? 0 : item.startAt.getTime(),
                      node: (
                        <ScheduleItem
                          key={item.id}
                          timeId={`item-${item.id}`}
                          label={item.title}
                          opensInList
                          wide
                          icon={<PlanIconTile kind={item.kind} />}
                          description={`${tLabels.dynamic(`planKinds.${item.kind}`, undefined, item.kind)} · ${formatDateLong(item.startAt, locale)}`}
                          actions={menu}
                          details={
                            <PlanDetails
                              plan={{
                                start: item.startAt,
                                end: item.endAt,
                                allDay: item.allDay,
                                placeName: item.placeName,
                                destination: null,
                                tags: [],
                                seriesDays: otherSeriesDays(
                                  item.seriesId,
                                  item.startAt,
                                ),
                                cost: null,
                                notes: item.notes,
                                place: itemPlace,
                              }}
                            />
                          }
                        >
                          {card}
                        </ScheduleItem>
                      ),
                    };
                  }),
                ]
                  // Earliest first; all-day plans lead the day.
                  .sort((a, b) => a.at - b.at)
                  .map((entry) => entry.node)}
                <div className={`grid ${detailClass}`}>
                  <AddPlanButton date={key} className="w-full" />
                </div>
              </>
            );
            return {
              key,
              date: key,
              dateLabel: formatDateLong(day, locale),
              condition: weather?.condition ?? null,
              forecast: weather
                ? `${tLabels.dynamic(`weather.${weather.condition}`, undefined, weather.condition)} · ${Math.round(weather.tempMin)}–${Math.round(weather.tempMax)}°C`
                : null,
              content,
            };
          })}
        />
      </AddPlanProvider>
    </div>
  );
}
