import { formatDate } from "@/lib/dates";

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
};

type DailyPayload = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  wind_speed_10m_max?: number[];
};

export function conditionFromCode(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Mixed";
}

function rowsFromDaily(daily: DailyPayload | undefined): DailyForecast[] {
  if (!daily?.time) return [];
  return daily.time.map((date, index) => {
    const weatherCode = daily.weather_code?.[index] ?? 0;
    return {
      date,
      tempMin: daily.temperature_2m_min?.[index] ?? 0,
      tempMax: daily.temperature_2m_max?.[index] ?? 0,
      precipitation: daily.precipitation_sum?.[index] ?? 0,
      windSpeed: daily.wind_speed_10m_max?.[index] ?? 0,
      weatherCode,
      condition: conditionFromCode(weatherCode),
    };
  });
}

async function fetchRange(
  base: string,
  lat: number,
  lng: number,
  start: string,
  end: string,
) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    timezone: "auto",
    start_date: start,
    end_date: end,
  });
  const response = await fetch(`${base}?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { daily?: DailyPayload };
  return rowsFromDaily(data.daily);
}

export async function fetchDailyForecast(lat: number, lng: number, start: Date, end: Date) {
  const startKey = formatDate(start);
  const endKey = formatDate(end);
  const today = formatDate(new Date());

  const rows = new Map<string, DailyForecast>();
  const add = (items: DailyForecast[]) => {
    for (const item of items) rows.set(item.date, item);
  };

  if (endKey < today) {
    add(await fetchRange("https://archive-api.open-meteo.com/v1/archive", lat, lng, startKey, endKey));
  } else if (startKey >= today) {
    add(await fetchRange("https://api.open-meteo.com/v1/forecast", lat, lng, startKey, endKey));
  } else {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    add(
      await fetchRange(
        "https://archive-api.open-meteo.com/v1/archive",
        lat,
        lng,
        startKey,
        formatDate(yesterday),
      ),
    );
    add(await fetchRange("https://api.open-meteo.com/v1/forecast", lat, lng, today, endKey));
  }

  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}
