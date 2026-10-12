import { cookies } from "next/headers";
import { CalendarDays } from "lucide-react";
import { PlaceLinks } from "@/components/place-links";
import { ActivityEditor, PlanEditor, ScheduleItemMenu } from "@/components/day-editor";
import { MemberTag } from "@/components/member-tag";
import { FlightEditor, PlanForm, PlanTag, StayEditor } from "@/components/plan-form";
import { ScheduleBoard, ScheduleItem } from "@/components/schedule-board";
import { deleteActivity } from "@/lib/actions/destinations";
import { deleteFlight, deleteScheduleItem, deleteStay } from "@/lib/actions/schedule";
import { dateKey, eachDate, formatDateLong, formatTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

export default async function SchedulePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const layoutCookie = (await cookies()).get("duffle-schedule-layout")?.value;
  const initialLayout = layoutCookie === "calendar" ? "calendar" : "list";
  const { trip } = await requireTrip(tripId);
  const [members, destinations, flights, stays, items, weatherDays] = await Promise.all([
    acceptedMembers(tripId),
    prisma.destination.findMany({
      where: { tripId },
      include: { activities: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.flight.findMany({
      where: { tripId },
      include: { travelers: { include: { user: true } } },
      orderBy: { departAt: "asc" },
    }),
    prisma.stay.findMany({ where: { tripId }, orderBy: { checkIn: "asc" } }),
    prisma.scheduleItem.findMany({ where: { tripId }, orderBy: { startAt: "asc" } }),
    prisma.weatherDay.findMany({ where: { destination: { tripId } } }),
  ]);

  const people = members.map((member) => ({
    id: member.userId,
    label: <MemberTag userId={member.userId} name={member.user.name} imageKey={member.user.imageKey} />,
  }));
  const days = eachDate(trip.startDate, trip.endDate);
  const itemClass =
    "schedule-item flex items-start justify-between gap-3 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm in-data-[layout=calendar]:items-center in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:rounded-md in-data-[layout=calendar]:relative in-data-[layout=calendar]:w-full in-data-[layout=calendar]:min-w-0 in-data-[layout=calendar]:overflow-hidden in-data-[layout=calendar]:cursor-pointer in-data-[layout=calendar]:py-1 in-data-[layout=calendar]:pr-6 in-data-[layout=calendar]:pl-1.5 in-data-[layout=calendar]:text-xs in-data-[layout=calendar]:transition-colors in-data-[layout=calendar]:hover:border-foreground/30 in-data-[layout=calendar]:hover:bg-background in-data-[layout=calendar]:hover:shadow-sm";
  const detailClass = "in-data-[layout=calendar]:hidden";
  const titleClass =
    "flex w-full min-w-0 flex-wrap items-center gap-2 font-medium in-data-[layout=calendar]:flex-nowrap in-data-[layout=calendar]:gap-1 in-data-[layout=calendar]:overflow-hidden";

  return (
    <div className="grid gap-6">
      <PlanForm
        tripId={tripId}
        currency={trip.baseCurrency}
        people={people}
        destinations={destinations.map((destination) => ({ id: destination.id, name: destination.name }))}
      />

      <ScheduleBoard
        initialLayout={initialLayout}
        days={days.map((day) => {
          const key = dateKey(day);
          const weather = weatherDays.find((entry) => dateKey(entry.date) === key);
          const dayFlights = flights.filter((flight) => dateKey(flight.departAt) === key);
          const dayStays = stays.filter(
            (stay) => dateKey(stay.checkIn) === key || dateKey(stay.checkOut) === key,
          );
          const dayItems = items.filter((item) => dateKey(item.startAt) === key);
          const dayActivities = destinations.flatMap((destination) =>
            destination.activities
              .filter((activity) => activity.startAt && dateKey(activity.startAt) === key)
              .map((activity) => ({
                ...activity,
                place: destination.name,
                target:
                  activity.lat != null && activity.lng != null
                    ? { name: activity.title, placeId: activity.placeId, lat: activity.lat, lng: activity.lng }
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
            dayFlights.length + dayStays.length + dayItems.length + dayActivities.length === 0;

          const renderItems = () => (
              <>
                {empty ? (
                  <p className={`flex items-center gap-2 text-sm text-muted-foreground ${detailClass}`}>
                    <CalendarDays className="size-4" />
                    Nothing planned.
                  </p>
                ) : null}
                {dayFlights.map((flight) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind="FLIGHT" />
                        <span className="min-w-0 flex-1 truncate">
                          {formatTime(flight.departAt)} {flight.airline} {flight.flightNumber}
                        </span>
                      </p>
                      <p className={`text-muted-foreground ${detailClass}`}>
                        {flight.fromAirport} → {flight.toAirport}, arrives {formatTime(flight.arriveAt)}
                        {flight.confirmation ? ` · ${flight.confirmation}` : ""}
                      </p>
                      {flight.travelers.length > 0 ? (
                        <p className={`mt-1 flex flex-wrap gap-2 ${detailClass}`}>
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
                      <span className={`mt-2 grid gap-1.5 ${detailClass}`}>
                        <PlaceLinks
                          label={`To ${flight.fromAirport}`}
                          place={{
                            name: `${flight.fromAirport} airport`,
                            lat: flight.fromLat,
                            lng: flight.fromLng,
                          }}
                        />
                        <PlaceLinks
                          label={`To ${flight.toAirport}`}
                          place={{
                            name: `${flight.toAirport} airport`,
                            lat: flight.toLat,
                            lng: flight.toLng,
                          }}
                        />
                      </span>
                    </div>
                    <ScheduleItemMenu
                      label={`${flight.airline} ${flight.flightNumber}`}
                      confirmMessage={`Are you sure you want to remove ${flight.airline} ${flight.flightNumber}?`}
                      remove={deleteFlight.bind(null, tripId, flight.id)}
                    >
                      <FlightEditor
                        tripId={tripId}
                        people={people}
                        flight={{
                          id: flight.id,
                          airline: flight.airline,
                          flightNumber: flight.flightNumber,
                          fromAirport: flight.fromAirport,
                          toAirport: flight.toAirport,
                          departAt: flight.departAt.toISOString().slice(0, 16),
                          arriveAt: flight.arriveAt.toISOString().slice(0, 16),
                          confirmation: flight.confirmation ?? "",
                          notes: flight.notes ?? "",
                          travelerIds: flight.travelers.map((traveler) => traveler.userId),
                        }}
                      />
                    </ScheduleItemMenu>
                  </div>
                  );
                  return (
                    <ScheduleItem
                      key={flight.id}
                      label={`${flight.airline} ${flight.flightNumber}`}
                      details={card()}
                    >
                      {card()}
                    </ScheduleItem>
                  );
                })}
                {dayStays.map((stay) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind="STAY" />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="hidden in-data-[layout=calendar]:inline">
                            {formatTime(dateKey(stay.checkIn) === key ? stay.checkIn : stay.checkOut)}{" "}
                          </span>
                          {dateKey(stay.checkIn) === key ? "Check in" : "Check out"} · {stay.name}
                        </span>
                      </p>
                      <p className={`text-muted-foreground ${detailClass}`}>
                        {formatTime(dateKey(stay.checkIn) === key ? stay.checkIn : stay.checkOut)}
                        {stay.address ? ` · ${stay.address}` : ""}
                      </p>
                      <PlaceLinks
                        className={`mt-1.5 ${detailClass}`}
                        place={{ name: stay.name, address: stay.address, lat: stay.lat, lng: stay.lng }}
                      />
                    </div>
                    <ScheduleItemMenu
                      label={stay.name}
                      confirmMessage={`Are you sure you want to remove ${stay.name}?`}
                      remove={deleteStay.bind(null, tripId, stay.id)}
                    >
                      <StayEditor
                        tripId={tripId}
                        destinations={destinations.map((destination) => ({
                          id: destination.id,
                          name: destination.name,
                        }))}
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
                  </div>
                  );
                  const stayLabel = dateKey(stay.checkIn) === key ? `Check in · ${stay.name}` : `Check out · ${stay.name}`;
                  return (
                    <ScheduleItem key={`${stay.id}-${key}`} label={stayLabel} details={card()}>
                      {card()}
                    </ScheduleItem>
                  );
                })}
                {dayActivities.map((activity) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          <span className="hidden in-data-[layout=calendar]:inline">
                            {activity.startAt ? `${formatTime(activity.startAt)} ` : ""}
                          </span>
                          {activity.title}
                        </span>
                        <span className={`font-normal text-muted-foreground ${detailClass}`}>
                          {" "}
                          · {activity.place}
                          {activity.startAt ? ` · ${formatTime(activity.startAt)}` : ""}
                        </span>
                      </p>
                      <PlaceLinks className={`mt-1.5 ${detailClass}`} place={activity.target} />
                    </div>
                    <ScheduleItemMenu
                      label={activity.title}
                      confirmMessage={`Are you sure you want to remove ${activity.title}?`}
                      remove={deleteActivity.bind(null, tripId, activity.id)}
                    >
                      <ActivityEditor
                        tripId={tripId}
                        activity={{
                          id: activity.id,
                          title: activity.title,
                          notes: activity.notes ?? "",
                          startAt: activity.startAt ? activity.startAt.toISOString().slice(0, 16) : "",
                          endAt: activity.endAt ? activity.endAt.toISOString().slice(0, 16) : "",
                        }}
                      />
                    </ScheduleItemMenu>
                  </div>
                  );
                  return (
                    <ScheduleItem key={activity.id} label={activity.title} details={card()}>
                      {card()}
                    </ScheduleItem>
                  );
                })}
                {dayItems.map((item) => {
                  const card = () => (
                  <div className={itemClass}>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass}>
                        <PlanTag kind={item.kind} />
                        <span className="min-w-0 flex-1 truncate">
                          {formatTime(item.startAt)} {item.title}
                        </span>
                      </p>
                      {item.placeName ? <p className={`text-muted-foreground ${detailClass}`}>{item.placeName}</p> : null}
                      {item.placeName || (item.lat != null && item.lng != null) ? (
                        <PlaceLinks
                          className={`mt-1.5 ${detailClass}`}
                          place={{ name: item.placeName || item.title, lat: item.lat, lng: item.lng }}
                        />
                      ) : null}
                    </div>
                    <ScheduleItemMenu
                      label={item.title}
                      confirmMessage={`Are you sure you want to remove ${item.title}?`}
                      remove={deleteScheduleItem.bind(null, tripId, item.id)}
                    >
                      <PlanEditor
                        tripId={tripId}
                        plan={{
                          id: item.id,
                          title: item.title,
                          kind: item.kind,
                          startAt: item.startAt.toISOString().slice(0, 16),
                          endAt: item.endAt ? item.endAt.toISOString().slice(0, 16) : "",
                          placeName: item.placeName ?? "",
                          notes: item.notes ?? "",
                        }}
                      />
                    </ScheduleItemMenu>
                  </div>
                  );
                  return (
                    <ScheduleItem key={item.id} label={item.title} details={card()}>
                      {card()}
                    </ScheduleItem>
                  );
                })}
              </>
            );
            return {
            key,
            date: key,
            dateLabel: formatDateLong(day),
            condition: weather?.condition ?? null,
            forecast: weather
              ? `${weather.condition} · ${Math.round(weather.tempMin)}–${Math.round(weather.tempMax)}°C`
              : null,
            content: renderItems(),
            detail: renderItems(),
          };
        })}
      />
    </div>
  );
}
