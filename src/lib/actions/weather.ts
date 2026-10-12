"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";
import { fetchDailyForecast } from "@/lib/weather";

export async function refreshWeather(tripId: string) {
  await requireTrip(tripId);
  const destinations = await prisma.destination.findMany({ where: { tripId } });
  if (destinations.length === 0) return { error: "Add a destination before loading weather." };

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
    return { error: "No forecast was returned for these dates. Open-Meteo covers about 16 days ahead, and past dates use the archive." };
  }
  return { ok: true, saved };
}
