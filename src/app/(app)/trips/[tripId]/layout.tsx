import { FlagStack } from "@/components/country-flag";
import { ShareTrip } from "@/components/share-trip";
import { TripNav } from "@/components/trip-nav";
import { countryName } from "@/lib/account-details";
import { formatDateLong } from "@/lib/dates";
import { flagsForTrip } from "@/lib/flight-countries";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { user, trip } = await requireTrip(tripId);
  const [account, flights, destinations] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { country: true } }),
    prisma.flight.findMany({
      where: { tripId },
      select: { toAirport: true, departAt: true },
      orderBy: { departAt: "asc" },
    }),
    prisma.destination.findMany({
      where: { tripId },
      select: { address: true, startDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);
  const countries = flagsForTrip({ homeCountry: account?.country, flights, destinations });

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            {countries.length > 0 ? <FlagStack codes={countries} label={countries.map(countryName).join(", ")} /> : null}
            <span className="min-w-0 flex-1 break-words">{trip.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateLong(trip.startDate)} – {formatDateLong(trip.endDate)} · balances in {trip.baseCurrency}
          </p>
        </div>
        <ShareTrip
          tripId={tripId}
          name={trip.name}
          url={`${(process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/join/${trip.joinToken}`}
        />
      </div>
      <TripNav tripId={tripId} />
      {children}
    </div>
  );
}
