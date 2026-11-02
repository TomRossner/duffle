import { dateKey, eachDate, parseDate, parseDateTime } from "@/lib/dates";

const maxRepeats = 60;

export type ScheduleWhen = {
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  /** Extra trip days (YYYY-MM-DD) to copy the plan onto, excluding the start day. */
  repeatDates: string[];
};

/**
 * Read the shared start/end/all-day/repeat fields of schedule forms.
 * All-day plans are stored at 00:00 of their day with no end time.
 */
export function readScheduleWhen(
  formData: FormData,
  trip: { startDate: Date; endDate: Date },
  { requireStart = true }: { requireStart?: boolean } = {},
): ScheduleWhen | { error: string } | { empty: true } {
  const allDay = formData.get("allDay") === "on";
  const startRaw = String(formData.get("startAt") ?? "").slice(0, 16);
  const endRaw = String(formData.get("endAt") ?? "").slice(0, 16);

  let startAt: Date | null;
  let endAt: Date | null = null;
  if (allDay) {
    startAt = parseDate(startRaw.slice(0, 10));
    if (!startAt) return { error: "Choose the day." };
  } else {
    if (!startRaw) {
      if (requireStart) return { error: "Choose a start time." };
      return { empty: true };
    }
    startAt = parseDateTime(startRaw);
    if (!startAt) return { error: "Start time is invalid." };
    if (endRaw) {
      endAt = parseDateTime(endRaw);
      if (!endAt) return { error: "End time is invalid." };
      if (endAt < startAt) return { error: "End time must be after the start." };
    }
  }

  const tripDays = new Set(eachDate(trip.startDate, trip.endDate).map(dateKey));
  const startDay = dateKey(startAt);
  const repeatDates = [...new Set(formData.getAll("repeatDates").map(String))]
    .filter((day) => day !== startDay && tripDays.has(day))
    .sort();
  if (repeatDates.length > maxRepeats) return { error: `Repeat on at most ${maxRepeats} days.` };

  return { startAt, endAt, allDay, repeatDates };
}

/** Move a timestamp to another day, keeping its time of day. */
export function onDay(date: Date, day: string) {
  const target = parseDate(day);
  if (!target) return date;
  return new Date(target.getTime() + (date.getTime() - parseDate(dateKey(date))!.getTime()));
}

/** Start/end for each repeat day, keeping the plan's times and duration. */
export function repeatTimes(when: ScheduleWhen) {
  return when.repeatDates.map((day) => {
    const startAt = onDay(when.startAt, day);
    const endAt = when.endAt ? new Date(startAt.getTime() + (when.endAt.getTime() - when.startAt.getTime())) : null;
    return { startAt, endAt };
  });
}

type Timing = { startAt: Date; endAt: Date | null };

/**
 * Line up an edited plan's series with the days chosen in the form: the edited plan takes the start day,
 * one existing copy is kept (and retimed) per other chosen day, copies on unchosen days are removed,
 * and chosen days without a copy are created.
 */
export function planSeries(
  when: ScheduleWhen,
  editedId: string,
  members: { id: string; startAt: Date | null }[],
) {
  const targets = new Map<string, Timing>([[dateKey(when.startAt), { startAt: when.startAt, endAt: when.endAt }]]);
  const repeats = repeatTimes(when);
  when.repeatDates.forEach((day, index) => targets.set(day, repeats[index]));

  const update: ({ id: string } & Timing)[] = [{ id: editedId, startAt: when.startAt, endAt: when.endAt }];
  const taken = new Set([dateKey(when.startAt)]);
  const remove: string[] = [];
  for (const member of members) {
    if (member.id === editedId) continue;
    const day = member.startAt ? dateKey(member.startAt) : null;
    const target = day ? targets.get(day) : undefined;
    if (!day || !target || taken.has(day)) {
      remove.push(member.id);
      continue;
    }
    taken.add(day);
    update.push({ id: member.id, ...target });
  }
  const create = [...targets.entries()].filter(([day]) => !taken.has(day)).map(([, timing]) => timing);
  return { update, create, remove };
}
