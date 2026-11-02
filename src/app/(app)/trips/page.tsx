import Link from "next/link";
import { MapPinned, Plus } from "lucide-react";
import { PendingInvites } from "@/components/pending-invites";
import { FlagStack } from "@/components/country-flag";
import { Badge } from "@/components/ui/badge";
import { memberColor } from "@/lib/member-color";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countryName } from "@/lib/account-details";
import { formatDateRange } from "@/lib/dates";
import { flagsForTrip } from "@/lib/flight-countries";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export default async function TripsPage() {
  const user = await requireUser();
  const [account, memberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { country: true } }),
    prisma.tripMember.findMany({
      where: { userId: user.id, status: "ACCEPTED" },
      include: {
        trip: {
          include: {
            _count: { select: { members: { where: { status: "ACCEPTED" } } } },
            flights: { select: { toAirport: true, departAt: true }, orderBy: { departAt: "asc" } },
            destinations: { select: { address: true, startDate: true }, orderBy: { startDate: "asc" } },
          },
        },
      },
      orderBy: { trip: { startDate: "asc" } },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground">Trips you created or joined.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/trips/new" />}>
          <Plus className="size-4" />
          New trip
        </Button>
      </div>
      <PendingInvites userId={user.id} />
      {memberships.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="size-5" />
              No trips yet
            </CardTitle>
            <CardDescription>Create one and invite the people who are going.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {memberships.map((membership) => {
            const countries = flagsForTrip({
              homeCountry: account?.country,
              flights: membership.trip.flights,
              destinations: membership.trip.destinations,
            });
            return (
              <Link key={membership.id} href={`/trips/${membership.tripId}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {countries.length > 0 ? (
                      <FlagStack codes={countries} label={countries.map(countryName).join(", ")} />
                    ) : null}
                    {membership.trip.name}
                    <Badge variant="secondary" className="gap-1.5">
                      <span className={`size-2 rounded-full ${memberColor(membership.userId)}`} />
                      {membership.role === "ADMIN" ? "Admin" : "Traveler"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {formatDateRange(membership.trip.startDate, membership.trip.endDate)} ·{" "}
                    {membership.trip._count.members} travelers · {membership.trip.baseCurrency}
                  </CardDescription>
                </CardHeader>
                {membership.trip.coverNote ? (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{membership.trip.coverNote}</p>
                  </CardContent>
                ) : null}
              </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
