import { BedDouble } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StayCard, StayFormToggle, type StayStatus } from "@/components/stay-form";
import { deleteStay } from "@/lib/actions/schedule";
import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";
import { formatMoney } from "@/lib/utils";

export default async function StaysPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const [destinations, stays] = await Promise.all([
    prisma.destination.findMany({ where: { tripId }, orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }] }),
    prisma.stay.findMany({
      where: { tripId },
      include: { expense: { select: { amount: true, currency: true } } },
      orderBy: { checkIn: "asc" },
    }),
  ]);
  const destinationOptions = destinations.map(({ id, name }) => ({ id, name }));
  // Stay times are the place's local wall-clock time, so compare by calendar day rather than to the minute.
  const today = dateKey(new Date());
  const statusOf = (checkIn: Date, checkOut: Date): StayStatus =>
    dateKey(checkOut) < today ? "past" : dateKey(checkIn) <= today ? "current" : "upcoming";
  const nights = stays.reduce(
    (sum, stay) =>
      sum + Math.max(0, Math.round((Date.parse(dateKey(stay.checkOut)) - Date.parse(dateKey(stay.checkIn))) / 86_400_000)),
    0,
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StayFormToggle tripId={tripId} destinations={destinationOptions} currency={trip.baseCurrency} />
        {stays.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {stays.length} {stays.length === 1 ? "stay" : "stays"} · {nights} {nights === 1 ? "night" : "nights"}
          </p>
        ) : null}
      </div>
      {stays.length === 0 ? (
        <EmptyState icon={BedDouble} title="No stays yet">
          Add each hotel or rental with check-in and check-out times, the address and the confirmation number. Stays
          show up on the schedule on the days you arrive and leave.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {stays.map((stay) => (
            <StayCard
              key={stay.id}
              tripId={tripId}
              destinations={destinationOptions}
              remove={deleteStay.bind(null, tripId, stay.id)}
              details={{
                lat: stay.lat,
                lng: stay.lng,
                cost: stay.expense ? formatMoney(Number(stay.expense.amount), stay.expense.currency) : null,
                status: statusOf(stay.checkIn, stay.checkOut),
              }}
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
          ))}
        </div>
      )}
    </div>
  );
}
