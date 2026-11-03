import { ChevronRight, MapPin } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ActivityComposer } from "@/components/activity-composer";
import { ActivityEditor, ScheduleItemMenu } from "@/components/day-editor";
import { PlaceLinks } from "@/components/place-links";
import { DestinationCard } from "@/components/destination-card";
import { DestinationForm } from "@/components/destination-form";
import { CheckList, CostFields, Field, FieldGroup } from "@/components/fields";
import { MapView } from "@/components/map-view";
import { ScheduleWhenFields } from "@/components/schedule-when-fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, deleteActivity, deleteDestination } from "@/lib/actions/destinations";
import { ACTIVITY_TAGS } from "@/lib/constants";
import { eachDate, formatDate, formatDateLong, formatTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_COLORS, ActivityTagLabel, isActivityTag } from "@/lib/tag-meta";
import { requireTrip } from "@/lib/trip-access";
import { cn } from "@/lib/utils";

function stayLabel(start: Date, end: Date) {
  if (formatDate(start) === formatDate(end)) return formatDateLong(start);
  const first = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const last = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);
  return `${first} – ${last}`;
}

function activityWhen(start: Date, end: Date | null, allDay = false) {
  const day = formatDateLong(start);
  if (allDay) return `${day} · All day`;
  const startTime = formatTime(start);
  if (!end || end.getTime() === start.getTime()) return `${day} · ${startTime}`;
  if (formatDate(start) === formatDate(end)) return `${day} · ${startTime}–${formatTime(end)}`;
  return `${day} · ${startTime} – ${formatDateLong(end)} · ${formatTime(end)}`;
}

export default async function MapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const destinations = await prisma.destination.findMany({
    where: { tripId },
    include: { activities: { orderBy: { startAt: "asc" } } },
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }],
  });

  const markers = destinations.map((destination) => ({
    id: destination.id,
    lat: destination.lat,
    lng: destination.lng,
    label: destination.name,
  }));
  const dateHint = `During the trip, ${formatDateLong(trip.startDate)} – ${formatDateLong(trip.endDate)}.`;
  const tripDays = eachDate(trip.startDate, trip.endDate).map(formatDate);

  // Days each repeating activity is on, so its edit form can show (and manage) all of them.
  const seriesDays = new Map<string, string[]>();
  for (const destination of destinations) {
    for (const activity of destination.activities) {
      if (!activity.seriesId || !activity.startAt) continue;
      seriesDays.set(activity.seriesId, [...(seriesDays.get(activity.seriesId) ?? []), formatDate(activity.startAt)]);
    }
  }
  const otherSeriesDays = (seriesId: string | null, startAt: Date | null) =>
    seriesId && startAt
      ? (seriesDays.get(seriesId) ?? []).filter((day) => day !== formatDate(startAt))
      : [];

  return (
    <div className="grid gap-6">
      <MapView
        apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}
        mapId={process.env.GOOGLE_MAPS_MAP_ID}
        markers={markers}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="grid gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-medium">
              <MapPin className="size-4" />
              Destinations
            </h2>
            <p className="text-sm text-muted-foreground">Each stop is a place and the days you are there.</p>
          </div>
          {destinations.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">No destinations yet. Search for the first city on this trip.</p>
              </CardContent>
            </Card>
          ) : (
            destinations.map((destination, index) => {
              const note = destination.notes?.trim();
              const noteRepeatsActivity = destination.activities.some((activity) => activity.title.trim() === note);
              return (
                <DestinationCard
                  key={destination.id}
                  tripId={tripId}
                  index={index}
                  dates={stayLabel(destination.startDate, destination.endDate)}
                  dateHint={dateHint}
                  note={note && !noteRepeatsActivity ? note : null}
                  remove={deleteDestination.bind(null, tripId, destination.id)}
                  destination={{
                    id: destination.id,
                    name: destination.name,
                    address: destination.address,
                    placeId: destination.placeId,
                    lat: destination.lat,
                    lng: destination.lng,
                    startDate: formatDate(destination.startDate),
                    endDate: formatDate(destination.endDate),
                    notes: destination.notes,
                  }}
                >
                  <details open className="group">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
                      Activities
                      <span className="font-normal text-muted-foreground">({destination.activities.length})</span>
                    </summary>
                    <div className="mt-2 grid gap-2">
                      {destination.activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nothing planned at this stop yet.</p>
                      ) : (
                        <ul className="grid gap-2">
                          {destination.activities.map((activity) => (
                            <li key={activity.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                              <span className="min-w-0 flex-1">
                                <span className="inline-flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium">{activity.title}</span>
                                  {activity.tags.filter(isActivityTag).map((tag) => (
                                    <span
                                      key={tag}
                                      className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                                        ACTIVITY_COLORS[tag],
                                      )}
                                    >
                                      <ActivityTagLabel tag={tag} iconClassName="size-3.5" />
                                    </span>
                                  ))}
                                </span>
                                {activity.startAt ? (
                                  <span className="block text-muted-foreground">
                                    {activityWhen(activity.startAt, activity.endAt, activity.allDay)}
                                  </span>
                                ) : null}
                                {activity.notes && activity.notes.trim() !== activity.title.trim() ? (
                                  <span className="block text-muted-foreground">{activity.notes}</span>
                                ) : null}
                                {activity.lat != null && activity.lng != null ? (
                                  <PlaceLinks
                                    className="mt-1.5"
                                    place={{
                                      name: activity.title,
                                      placeId: activity.placeId,
                                      lat: activity.lat,
                                      lng: activity.lng,
                                    }}
                                  />
                                ) : null}
                              </span>
                              <ScheduleItemMenu
                                label={activity.title}
                                confirmMessage={`Are you sure you want to remove ${activity.title}?`}
                                remove={deleteActivity.bind(null, tripId, activity.id)}
                              >
                                <ActivityEditor
                                  tripId={tripId}
                                  tripDays={tripDays}
                                  activity={{
                                    id: activity.id,
                                    title: activity.title,
                                    notes: activity.notes ?? "",
                                    startAt: activity.startAt ? activity.startAt.toISOString().slice(0, 16) : "",
                                    endAt: activity.endAt ? activity.endAt.toISOString().slice(0, 16) : "",
                                    allDay: activity.allDay,
                                    seriesDays: otherSeriesDays(activity.seriesId, activity.startAt),
                                    tags: activity.tags,
                                  }}
                                />
                              </ScheduleItemMenu>
                            </li>
                          ))}
                        </ul>
                      )}
                      <ActivityComposer>
                        <ActionForm action={createActivity.bind(null, tripId, destination.id)} submitLabel="Add activity">
                          <Field label="Activity">
                            <Input name="title" required />
                          </Field>
                          <ScheduleWhenFields tripDays={tripDays} />
                          <FieldGroup label="Tags">
                            <CheckList
                              name="tags"
                              defaultChecked={false}
                              options={ACTIVITY_TAGS.map((tag) => ({
                                id: tag,
                                color: ACTIVITY_COLORS[tag],
                                label: <ActivityTagLabel tag={tag} />,
                              }))}
                            />
                          </FieldGroup>
                          <Field label="Notes">
                            <Textarea name="notes" rows={2} />
                          </Field>
                          <CostFields currency={trip.baseCurrency} withSymbols />
                        </ActionForm>
                      </ActivityComposer>
                    </div>
                  </details>
                </DestinationCard>
              );
            })
          )}
        </section>
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle>Add a destination</CardTitle>
            <CardDescription>Search for a city or place, then set the days you are there.</CardDescription>
          </CardHeader>
          <CardContent>
            <DestinationForm
              tripId={tripId}
              startDate={formatDate(trip.startDate)}
              endDate={formatDate(trip.endDate)}
              dateHint={dateHint}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
