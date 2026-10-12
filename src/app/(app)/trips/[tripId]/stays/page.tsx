import { BedDouble } from "lucide-react";
import { ActionForm, InlineAction } from "@/components/action-form";
import { PlaceLinks } from "@/components/place-links";
import { CostFields, Field, Select } from "@/components/fields";
import { DateAndTime } from "@/components/plan-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStay, deleteStay } from "@/lib/actions/schedule";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";

export default async function StaysPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const [destinations, stays] = await Promise.all([
    prisma.destination.findMany({ where: { tripId }, orderBy: { sortOrder: "asc" } }),
    prisma.stay.findMany({ where: { tripId }, orderBy: { checkIn: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="size-5" />
            Add a stay
          </CardTitle>
          <CardDescription>Hotels and other places you will sleep. Check-in and check-out also show on the schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={createStay.bind(null, tripId)} submitLabel="Add stay">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Address">
              <Input name="address" />
            </Field>
            <Field label="Destination">
              <Select name="destinationId" defaultValue="">
                <option value="">None</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <DateAndTime name="checkIn" dateLabel="Check in" timeLabel="Time" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DateAndTime name="checkOut" dateLabel="Check out" timeLabel="Time" required />
              </div>
            </div>
            <Field label="Confirmation">
              <Input name="confirmation" />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" rows={2} />
            </Field>
            <CostFields currency={trip.baseCurrency} />
          </ActionForm>
        </CardContent>
      </Card>
      <div className="grid gap-4">
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
          <Card key={stay.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <BedDouble className="size-4" />
                  {stay.name}
                </span>
                <InlineAction action={deleteStay.bind(null, tripId, stay.id)} label="Remove" variant="destructive" />
              </CardTitle>
              <CardDescription>
                {formatDateTime(stay.checkIn)} – {formatDateTime(stay.checkOut)}
                {stay.confirmation ? ` · ${stay.confirmation}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {stay.address ? <p>{stay.address}</p> : null}
              <PlaceLinks
                place={{
                  name: stay.name,
                  address: stay.address,
                  lat: stay.lat,
                  lng: stay.lng,
                }}
              />
              {stay.notes ? <p className="text-muted-foreground">{stay.notes}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
