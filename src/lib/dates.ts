export function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function asDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const shortMonth = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });

/** Single date in the app's compact style: "14 Sep 2026". */
export function formatDateShort(date: Date) {
  return `${date.getUTCDate()} ${shortMonth.format(date)} ${date.getUTCFullYear()}`;
}

/**
 * Compact trip range. The start date drops the parts it shares with the end date:
 * "14 – 20 Sep 2026", "14 Sep – 2 Oct 2026", "28 Dec 2026 – 3 Jan 2027", or "14 Sep 2026" for one day.
 */
export function formatDateRange(start: Date, end: Date) {
  const parts = (date: Date) => ({
    day: date.getUTCDate(),
    month: shortMonth.format(date),
    year: date.getUTCFullYear(),
  });
  const from = parts(start);
  const to = parts(end);
  const toText = formatDateShort(end);

  const sameYear = from.year === to.year;
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth && from.day === to.day) return toText;

  const fromText = sameMonth ? `${from.day}` : sameYear ? `${from.day} ${from.month}` : `${from.day} ${from.month} ${from.year}`;
  return `${fromText} – ${toText}`;
}

export function formatDateText(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function parseDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    ),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export function formatTime(date: Date) {
  return date.toISOString().slice(11, 16);
}

/**
 * Compact date-time range in the app's style. The start drops the year when it matches the end:
 * "14 Sep, 15:00 – 20 Sep 2026, 11:00", "28 Dec 2026, 15:00 – 3 Jan 2027, 11:00".
 */
export function formatDateTimeRange(start: Date, end: Date) {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startDate = sameYear ? `${start.getUTCDate()} ${shortMonth.format(start)}` : formatDateShort(start);
  return `${startDate}, ${formatTime(start)} – ${formatDateShort(end)}, ${formatTime(end)}`;
}

export function eachDate(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function sameDay(a: Date, b: Date) {
  return formatDate(a) === formatDate(b);
}

export function dateKey(date: Date) {
  return formatDate(date);
}
