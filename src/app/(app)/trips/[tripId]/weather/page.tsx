import Link from "next/link";
import { CloudRain, CloudSun, MapPin, Wind } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RefreshWeather } from "@/components/refresh-weather";
import { weatherLook } from "@/components/weather-mark";
import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { formatDateLong, formatDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";
import { cn } from "@/lib/utils";

export default async function WeatherPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await requireTrip(tripId);
  const t = await getT("weather");
  const tLabels = await getT("labels");
  const locale = t.locale;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const destinations = await prisma.destination.findMany({
    where: { tripId },
    include: { weatherDays: { orderBy: { date: "asc" } } },
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">{t("heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("sub")}</p>
        </div>
        <RefreshWeather tripId={tripId} />
      </div>
      {destinations.length === 0 ? (
        <EmptyState
          icon={CloudSun}
          title={t("emptyTitle")}
          action={
            <Button nativeButton={false} render={<Link href={`/trips/${tripId}/map`} />}>
              <MapPin />
              {t("addDestination")}
            </Button>
          }
        >
          {t("emptyBody")}
        </EmptyState>
      ) : (
        destinations.map((destination) => {
          const first = destination.weatherDays[0];
          const header = first ? weatherLook(first.condition) : null;
          return (
            <section key={destination.id} className="grid gap-3">
              <div className={cn("rounded-xl px-4 py-3", header?.panel ?? "bg-muted")}>
                <h3 className="text-lg font-medium">{destination.name}</h3>
                <p className="text-sm opacity-80">
                  {formatDateRange(destination.startDate, destination.endDate, locale)}
                </p>
              </div>
              {destination.weatherDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noDays")}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {destination.weatherDays.map((day) => {
                    const style = weatherLook(day.condition);
                    const Icon = style.icon;
                    return (
                      <article key={day.id} className={cn("grid gap-3 rounded-xl p-4", style.panel)}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{formatDateLong(day.date, locale)}</p>
                            <p className="text-2xl font-semibold tracking-tight">
                              {Math.round(day.tempMax)}°
                              <span className="ms-2 text-base font-normal opacity-70">{Math.round(day.tempMin)}°</span>
                            </p>
                          </div>
                          <span className={cn("grid size-12 place-items-center rounded-full", style.chip)}>
                            <Icon className="size-6" />
                          </span>
                        </div>
                        <p className="font-medium">{tLabels.dynamic(`weather.${day.condition}`, undefined, day.condition)}</p>
                        <div className="flex flex-wrap gap-3 text-sm opacity-80">
                          <span className="inline-flex items-center gap-1">
                            <CloudRain className="size-4" />
                            {t("mm", { value: number.format(day.precipitation) })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wind className="size-4" />
                            {t("kmh", { value: Math.round(day.windSpeed) })}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
