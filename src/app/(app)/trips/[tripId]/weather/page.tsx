import Link from "next/link";
import { CloudRain, CloudSun, MapPin, Wind } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RefreshWeather } from "@/components/refresh-weather";
import { weatherLook } from "@/components/weather-mark";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";
import { cn } from "@/lib/utils";

export default async function WeatherPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await requireTrip(tripId);
  const destinations = await prisma.destination.findMany({
    where: { tripId },
    include: { weatherDays: { orderBy: { date: "asc" } } },
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">Forecast</h2>
          <p className="text-sm text-muted-foreground">Daily conditions from Open-Meteo for each destination&apos;s dates.</p>
        </div>
        <RefreshWeather tripId={tripId} />
      </div>
      {destinations.length === 0 ? (
        <EmptyState
          icon={CloudSun}
          title="No forecast yet"
          action={
            <Button nativeButton={false} render={<Link href={`/trips/${tripId}/map`} />}>
              <MapPin />
              Add a destination
            </Button>
          }
        >
          The forecast follows your destinations. Add the places you&apos;re going on the map, with their dates, and
          their daily weather shows up here.
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
                  {formatDateRange(destination.startDate, destination.endDate)}
                </p>
              </div>
              {destination.weatherDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No forecast yet. Use Load forecast above once the trip is about two weeks away.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {destination.weatherDays.map((day) => {
                    const style = weatherLook(day.condition);
                    const Icon = style.icon;
                    return (
                      <article key={day.id} className={cn("grid gap-3 rounded-xl p-4", style.panel)}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{formatDateLong(day.date)}</p>
                            <p className="text-2xl font-semibold tracking-tight">
                              {Math.round(day.tempMax)}°
                              <span className="ml-2 text-base font-normal opacity-70">{Math.round(day.tempMin)}°</span>
                            </p>
                          </div>
                          <span className={cn("grid size-12 place-items-center rounded-full", style.chip)}>
                            <Icon className="size-6" />
                          </span>
                        </div>
                        <p className="font-medium">{day.condition}</p>
                        <div className="flex flex-wrap gap-3 text-sm opacity-80">
                          <span className="inline-flex items-center gap-1">
                            <CloudRain className="size-4" />
                            {day.precipitation.toFixed(1)} mm
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wind className="size-4" />
                            {Math.round(day.windSpeed)} km/h
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
