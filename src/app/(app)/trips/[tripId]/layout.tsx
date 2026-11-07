import { FlagStack } from "@/components/country-flag";
import { ShareTrip } from "@/components/share-trip";
import { tripJoinUrl } from "@/lib/join-url";
import { TripNav } from "@/components/trip-nav";
import { countryName } from "@/lib/account-details";
import { formatDateRange } from "@/lib/dates";
import { currencySymbol } from "@/lib/money";
import { requireTrip } from "@/lib/trip-access";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { trip } = await requireTrip(tripId);
  const countries = trip.countries;
  const symbol = currencySymbol(trip.baseCurrency);
  const currencyLabel = symbol ? `${symbol} (${trip.baseCurrency})` : trip.baseCurrency;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-start gap-2.5 text-2xl font-semibold tracking-tight">
            {countries.length > 0 ? <FlagStack codes={countries} label={countries.map(countryName).join(", ")} /> : null}
            <span className="min-w-0 flex-1 break-words">{trip.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(trip.startDate, trip.endDate)} · Balances in {currencyLabel}
          </p>
        </div>
        <ShareTrip
          tripId={tripId}
          name={trip.name}
          url={tripJoinUrl(trip.joinToken)}
        />
      </div>
      <TripNav tripId={tripId} />
      {children}
    </div>
  );
}
