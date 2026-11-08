import { ChevronRight, MapPin, Plus } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ActivityComposer } from "@/components/activity-composer";
import { ActivityEditor, ScheduleItemMenu } from "@/components/day-editor";
import { DirectionsButton } from "@/components/place-links";
import { DestinationCard } from "@/components/destination-card";
import { EmptyState } from "@/components/empty-state";
import { DestinationForm } from "@/components/destination-form";
import { CheckList, CostFields, Field, FieldGroup } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { MapView } from "@/components/map-view";
import { ScheduleWhenFields } from "@/components/schedule-when-fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, deleteActivity, deleteDestination } from "@/lib/actions/destinations";
import { ACTIVITY_TAGS } from "@/lib/constants";
import type { Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { eachDate, formatDate, formatDateLong, formatDateRange, formatTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_COLORS, ActivityTagLabel, isActivityTag } from "@/lib/tag-meta";
import { requireTrip } from "@/lib/trip-access";
import { cn } from "@/lib/utils";

function stayLabel(start: Date, end: Date, locale: Locale) {
  if (formatDate(start) === formatDate(end)) return formatDateLong(start, locale);
  if (locale !== "en") return formatDateRange(start, end, locale);
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

function activityWhen(start: Date, end: Date | null, allDay: boolean, locale: Locale, tSchedule: Translator<"schedule">) {
  const day = formatDateLong(start, locale);
  if (allDay) return `${day} · ${tSchedule("page.allDay")}`;
  const startTime = formatTime(start);
  if (!end || end.getTime() === start.getTime()) return `${day} · ${startTime}`;
  if (formatDate(start) === formatDate(end)) return `${day} · ${startTime}–${formatTime(end)}`;
  return `${day} · ${startTime} – ${formatDateLong(end, locale)} · ${formatTime(end)}`;
}

export default async function MapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const t = await getT("map");
  const tTrips = await getT("trips");
  const tSchedule = await getT("schedule");
  const tCommon = await getT("common");
  const locale = t.locale;
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
  const dateHint = tTrips("overview.dateHint", {
    start: formatDateLong(trip.startDate, locale),
    end: formatDateLong(trip.endDate, locale),
  });
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
      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-medium">
              <MapPin className="size-4" />
              {t("page.heading")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("page.sub")}</p>
          </div>
          <FormDialog
            title={t("page.addTitle")}
            description={t("page.addDescription")}
            triggerIcon={<Plus />}
            triggerClassName="w-full sm:w-fit"
          >
            <DestinationForm
              tripId={tripId}
              startDate={formatDate(trip.startDate)}
              endDate={formatDate(trip.endDate)}
              dateHint={dateHint}
            />
          </FormDialog>
        </div>
        {destinations.length === 0 ? (
          <EmptyState icon={MapPin} title={t("page.emptyTitle")}>
            {t("page.emptyBody")}
          </EmptyState>
        ) : (
          destinations.map((destination, index) => {
            const note = destination.notes?.trim();
            const noteRepeatsActivity = destination.activities.some((activity) => activity.title.trim() === note);
            return (
              <DestinationCard
                key={destination.id}
                tripId={tripId}
                index={index}
                dates={stayLabel(destination.startDate, destination.endDate, locale)}
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
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90 rtl:rotate-180" aria-hidden />
                    {t("page.activities")}
                    <span className="font-normal text-muted-foreground">({destination.activities.length})</span>
                  </summary>
                  <div className="mt-2 grid gap-2">
                    {destination.activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("page.nothingHere")}</p>
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
                                      "inline-flex items-center rounded-full px-2.5 py-1 text-sm",
                                      ACTIVITY_COLORS[tag],
                                    )}
                                  >
                                    <ActivityTagLabel tag={tag} iconClassName="size-4" />
                                  </span>
                                ))}
                              </span>
                              {activity.startAt ? (
                                <span className="block text-muted-foreground">
                                  {activityWhen(activity.startAt, activity.endAt, activity.allDay, locale, tSchedule)}
                                </span>
                              ) : null}
                              {activity.notes && activity.notes.trim() !== activity.title.trim() ? (
                                <span className="block text-muted-foreground">{activity.notes}</span>
                              ) : null}
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5">
                            {activity.lat != null && activity.lng != null ? (
                              <DirectionsButton
                                places={[
                                  {
                                    place: {
                                      name: activity.title,
                                      placeId: activity.placeId,
                                      lat: activity.lat,
                                      lng: activity.lng,
                                    },
                                  },
                                ]}
                              />
                            ) : null}
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
                                  startAt: activity.startAt ? activity.startAt.toISOString().slice(0, 16) : "",
                                  endAt: activity.endAt ? activity.endAt.toISOString().slice(0, 16) : "",
                                  allDay: activity.allDay,
                                  seriesDays: otherSeriesDays(activity.seriesId, activity.startAt),
                                  tags: activity.tags,
                                }}
                              />
                            </ScheduleItemMenu>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <ActivityComposer destination={destination.name}>
                      <ActionForm action={createActivity.bind(null, tripId, destination.id)} submitLabel={tSchedule("form.addActivity")}>
                        <Field label={tSchedule("form.activity")}>
                          <Input name="title" required />
                        </Field>
                        <ScheduleWhenFields tripDays={tripDays} />
                        <FieldGroup label={tSchedule("form.tags")}>
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
                        <Field label={tSchedule("form.notes")}>
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
    </div>
  );
}
