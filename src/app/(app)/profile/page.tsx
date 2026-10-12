import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { Avatar } from "@/components/avatar";
import { CountryFlag, FlagStack } from "@/components/country-flag";
import { PendingInvites } from "@/components/pending-invites";
import { ProfileEditor } from "@/components/profile-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countryName, formatPhone, genderLabel } from "@/lib/account-details";
import { formatDate, formatDateLong, formatDateText } from "@/lib/dates";
import { flagsForTrip } from "@/lib/flight-countries";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";
import { notFound } from "next/navigation";

function Detail({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={value ? "text-sm" : "text-sm text-muted-foreground"}>{value ?? "Not set"}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      imageKey: true,
      passwordHash: true,
      gender: true,
      birthDate: true,
      phone: true,
      country: true,
      address: true,
      city: true,
      postalCode: true,
      createdAt: true,
      memberships: {
        where: { status: "ACCEPTED" },
        include: {
          trip: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              flights: { select: { toAirport: true, departAt: true }, orderBy: { departAt: "asc" } },
              destinations: { select: { address: true, startDate: true }, orderBy: { startDate: "asc" } },
            },
          },
        },
        orderBy: { trip: { startDate: "asc" } },
      },
    },
  });
  if (!user) notFound();

  const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(user.createdAt);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your name and photo are shown to the people on your trips. The other details stay on your account.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Avatar name={user.name} userId={user.id} imageKey={user.imageKey} size="lg" />
              <div className="grid min-w-0 gap-1">
                <p className="text-lg font-medium">{user.name}</p>
                <p className="text-sm break-all text-muted-foreground">{user.email}</p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="secondary">{user.passwordHash ? "Email and password" : "Google"}</Badge>
                  <span className="text-xs text-muted-foreground">Joined {joined}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ProfileEditor
                defaults={{
                  name: user.name,
                  gender: user.gender,
                  birthDate: user.birthDate ? formatDate(user.birthDate) : "",
                  phone: user.phone,
                  country: user.country,
                  address: user.address,
                  city: user.city,
                  postalCode: user.postalCode,
                }}
              />
              <AccountMenu hasPassword={Boolean(user.passwordHash)} />
            </div>
          </div>
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <Detail label="Gender" value={genderLabel(user.gender)} />
            <Detail label="Birth date" value={user.birthDate ? formatDateText(user.birthDate) : null} />
            <Detail label="Phone" value={formatPhone(user.phone, user.country)} />
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              {user.country ? (
                <p className="flex items-center gap-2 text-sm">
                  <CountryFlag code={user.country} />
                  {countryName(user.country)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not set</p>
              )}
            </div>
            <Detail
              label="Address"
              value={[user.address, [user.city, user.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null}
              className="sm:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      <PendingInvites userId={user.id} />

      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
          <CardDescription>Trips you have joined.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No trips yet.{" "}
              <Link href="/trips" className="text-foreground underline">
                Go to Trips
              </Link>
            </p>
          ) : (
            <ul className="grid gap-2">
              {user.memberships.map((membership) => {
                const countries = flagsForTrip({
                  homeCountry: user.country,
                  flights: membership.trip.flights,
                  destinations: membership.trip.destinations,
                });
                return (
                  <li key={membership.id}>
                    <Link
                      href={`/trips/${membership.trip.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        {countries.length > 0 ? (
                          <FlagStack codes={countries} label={countries.map(countryName).join(", ")} />
                        ) : null}
                        <span className="min-w-0 break-words">{membership.trip.name}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDateLong(membership.trip.startDate)} – {formatDateLong(membership.trip.endDate)}
                        </span>
                        <Badge variant="secondary">{membership.role === "ADMIN" ? "Admin" : "Traveler"}</Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
