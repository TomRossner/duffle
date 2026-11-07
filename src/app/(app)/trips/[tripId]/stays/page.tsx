import { BedDouble } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StayCard, StayFormToggle } from "@/components/stay-form";
import { deleteStay } from "@/lib/actions/schedule";
import { formatDateTimeRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";

export default async function StaysPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const [destinations, stays] = await Promise.all([
    prisma.destination.findMany({ where: { tripId }, orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }] }),
    prisma.stay.findMany({ where: { tripId }, orderBy: { checkIn: "asc" } }),
  ]);
  const destinationOptions = destinations.map(({ id, name }) => ({ id, name }));

  return (
    <div className="grid gap-4">
      <StayFormToggle tripId={tripId} destinations={destinationOptions} currency={trip.baseCurrency} />
      {stays.length === 0 ? (
        <EmptyState icon={BedDouble} title="No stays yet">
          Add each hotel or rental with check-in and check-out times, the address and the confirmation number. Stays
          show up on the schedule on the days you arrive and leave.
        </EmptyState>
      ) : null}
      {stays.map((stay) => (
        <StayCard
          key={stay.id}
          tripId={tripId}
          destinations={destinationOptions}
          dates={formatDateTimeRange(stay.checkIn, stay.checkOut)}
          remove={deleteStay.bind(null, tripId, stay.id)}
          details={{ lat: stay.lat, lng: stay.lng }}
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
  );
}
