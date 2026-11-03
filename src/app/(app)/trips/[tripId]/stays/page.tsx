import { BedDouble } from "lucide-react";
import { StayCard, StayFormToggle } from "@/components/stay-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="size-5" />
              No stays yet
            </CardTitle>
            <CardDescription>Add the place you will sleep, with check-in and check-out.</CardDescription>
          </CardHeader>
        </Card>
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
