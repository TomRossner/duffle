"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import { parseDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";
import { fetchDailyForecast } from "@/lib/weather";

/** How far ahead the forecast service has days. */
const FORECAST_DAYS_AHEAD = 15;

export async function refreshWeather(tripId: string): Promise<{ error?: string; notice?: string; ok?: boolean; saved?: number }> {
  await requireTrip(tripId);
  const t = await getT("weather");
  const destinations = await prisma.destination.findMany({ where: { tripId } });
  if (destinations.length === 0) return { error: t("errors.noDestinations") };

  let saved = 0;
  for (const destination of destinations) {
    const days = await fetchDailyForecast(
      destination.lat,
      destination.lng,
      destination.startDate,
      destination.endDate,
    );
    for (const day of days) {
      const date = parseDate(day.date);
      if (!date) continue;
      await prisma.weatherDay.upsert({
        where: { destinationId_date: { destinationId: destination.id, date } },
        update: {
          tempMin: day.tempMin,
          tempMax: day.tempMax,
          precipitation: day.precipitation,
          windSpeed: day.windSpeed,
          condition: day.condition,
          weatherCode: day.weatherCode,
          fetchedAt: new Date(),
        },
        create: {
          destinationId: destination.id,
          date,
          tempMin: day.tempMin,
          tempMax: day.tempMax,
          precipitation: day.precipitation,
          windSpeed: day.windSpeed,
          condition: day.condition,
          weatherCode: day.weatherCode,
        },
      });
      saved += 1;
    }
  }

  revalidatePath(`/trips/${tripId}`);
  if (saved === 0) {
    // Forecasts only reach about two weeks out, so a trip further away simply has nothing yet.
    const firstDay = destinations.reduce((first, destination) => (destination.startDate < first ? destination.startDate : first), destinations[0].startDate);
    const daysAway = Math.floor((firstDay.getTime() - Date.now()) / 86_400_000);
    if (daysAway > FORECAST_DAYS_AHEAD) {
      return { notice: t("errors.tooEarly") };
    }
    return { error: t("errors.failed") };
  }
  return { ok: true, saved };
}
