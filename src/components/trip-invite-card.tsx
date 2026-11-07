import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CountryFlag } from "@/components/country-flag";
import { Card, CardContent } from "@/components/ui/card";
import { countryName } from "@/lib/account-details";
import { eachDate, formatDateRange } from "@/lib/dates";

const MAX_AVATARS = 5;

type InviteTrip = {
  name: string;
  startDate: Date;
  endDate: Date;
  countries: string[];
  coverNote: string | null;
};

type InviteTraveler = { userId: string; name: string; imageKey: string | null };

/** Full-page shell for the invite and join pages: logo, a centered card and a way back to the trip list. */
export function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-16 w-auto sm:h-20" />
      <Card className="w-full">{children}</Card>
      <Link href="/trips" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Back to my trips
      </Link>
    </main>
  );
}

/** Invitation details plus the actions the visitor can take. */
export function TripInviteCard({
  eyebrow,
  trip,
  travelers,
  children,
}: {
  eyebrow: string;
  trip: InviteTrip;
  travelers: InviteTraveler[];
  children: React.ReactNode;
}) {
  const days = eachDate(trip.startDate, trip.endDate).length;
  const shown = travelers.slice(0, MAX_AVATARS);
  const extra = travelers.length - shown.length;

  return (
    <InviteShell>
      <CardContent className="grid gap-5 py-2">
        <div className="grid gap-3 text-center">
          {trip.countries.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5" aria-hidden>
              {trip.countries.map((code) => (
                <CountryFlag key={code} code={code} className="h-8 w-12 rounded-[4px]" />
              ))}
            </div>
          ) : null}
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">{eyebrow}</p>
            <h1 className="text-2xl font-semibold tracking-tight break-words">{trip.name}</h1>
            {trip.coverNote ? <p className="text-sm text-muted-foreground">{trip.coverNote}</p> : null}
          </div>
        </div>

        <ul className="grid gap-2.5 rounded-lg bg-muted/60 p-3 text-sm">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {formatDateRange(trip.startDate, trip.endDate)}
              <span className="text-muted-foreground">
                {" "}
                · {days} {days === 1 ? "day" : "days"}
              </span>
            </span>
          </li>
          {trip.countries.length > 0 ? (
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">{trip.countries.map(countryName).join(", ")}</span>
            </li>
          ) : null}
          {travelers.length > 0 ? (
            <li className="flex items-center gap-2.5">
              <Users className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex shrink-0 items-center">
                {shown.map((traveler) => (
                  <Avatar
                    key={traveler.userId}
                    name={traveler.name}
                    userId={traveler.userId}
                    imageKey={traveler.imageKey}
                    className="-ml-1.5 ring-2 ring-background first:ml-0"
                  />
                ))}
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                {travelerSummary(shown.map((traveler) => traveler.name), extra)}
              </span>
            </li>
          ) : null}
        </ul>

        {children}
      </CardContent>
    </InviteShell>
  );
}

function travelerSummary(names: string[], extra: number) {
  const first = names[0]?.split(/\s+/)[0] ?? "";
  const others = names.length - 1 + extra;
  if (others <= 0) return first;
  return `${first} and ${others} ${others === 1 ? "other" : "others"}`;
}
