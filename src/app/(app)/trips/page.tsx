import Link from "next/link";
import { Plus } from "lucide-react";
import { PendingInvites } from "@/components/pending-invites";
import { ScanQrButton } from "@/components/scan-qr-button";
import { WelcomeCard } from "@/components/welcome-card";
import { FlagStack } from "@/components/country-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { countryList } from "@/lib/account-details";
import { formatDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export default async function TripsPage() {
  const user = await requireUser();
  const t = await getT("trips");
  const tCommon = await getT("common");
  const locale = t.locale;
  const memberships = await prisma.tripMember.findMany({
    where: { userId: user.id, status: "ACCEPTED" },
    include: {
      trip: {
        include: {
          _count: { select: { members: { where: { status: "ACCEPTED" } } } },
        },
      },
    },
    orderBy: { trip: { startDate: "asc" } },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("list.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("list.subtitle")}{" "}
            <Link href="/how-it-works" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("list.howItWorks")}
            </Link>
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <ScanQrButton />
          <Button nativeButton={false} render={<Link href="/trips/new" />}>
            <Plus className="size-4" />
            {t("list.newTrip")}
          </Button>
        </div>
      </div>
      <PendingInvites userId={user.id} />
      {memberships.length === 0 ? (
        <WelcomeCard name={user.name} />
      ) : (
        <div className="grid gap-3">
          {memberships.map((membership) => {
            const countries = membership.trip.countries;
            return (
              <Link key={membership.id} href={`/trips/${membership.tripId}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {membership.trip.name}
                    <Badge variant="secondary">
                      {membership.role === "ADMIN" ? t("roles.admin") : t("roles.traveler")}
                    </Badge>
                  </CardTitle>
                  {countries.length > 0 ? (
                    <div className="flex">
                      <FlagStack codes={countries} label={countryList(countries, locale)} size="sm" />
                    </div>
                  ) : null}
                  <CardDescription>
                    {formatDateRange(membership.trip.startDate, membership.trip.endDate, locale)} ·{" "}
                    {tCommon("travelers", { count: membership.trip._count.members })} ·{" "}
                    {membership.trip.baseCurrency}
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
