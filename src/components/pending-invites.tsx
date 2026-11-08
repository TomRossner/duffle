import { Mail } from "lucide-react";
import { InlineAction } from "@/components/action-form";
import { FlagStack } from "@/components/country-flag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { countryList } from "@/lib/account-details";
import { acceptInvite, declineInvite } from "@/lib/actions/trips";
import { eachDate, formatDateRange } from "@/lib/dates";
import { claimPendingInvites } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export async function PendingInvites({ userId }: { userId: string }) {
  await claimPendingInvites(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return null;

  const invites = await prisma.tripInvite.findMany({
    where: {
      email: { equals: user.email, mode: "insensitive" },
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      trip: {
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: { where: { status: "ACCEPTED" } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (invites.length === 0) return null;
  const t = await getT("trips");
  const tCommon = await getT("common");
  const locale = t.locale;

  return (
    <Card className="ring-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-4" />
          </span>
          {t("invites.title")}
          <Badge>{invites.length}</Badge>
        </CardTitle>
        <CardDescription>
          {t("invites.waiting", { count: invites.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3">
          {invites.map((invite) => {
            const { trip } = invite;
            const days = eachDate(trip.startDate, trip.endDate).length;
            const travelers = trip._count.members;
            return (
              <li key={invite.id} className="grid gap-3 rounded-lg bg-muted/60 p-3">
                <div className="grid min-w-0 gap-1">
                  <p className="text-base font-medium break-words">{trip.name}</p>
                  {trip.countries.length > 0 ? (
                    <div className="flex">
                      <FlagStack codes={trip.countries} label={countryList(trip.countries, locale)} size="sm" />
                    </div>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(trip.startDate, trip.endDate, locale)} · {tCommon("days", { count: days })} ·{" "}
                    {tCommon("travelers", { count: travelers })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.rich("invites.invitedBy", {
                      name: trip.owner.name,
                      b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <InlineAction
                    action={declineInvite.bind(null, invite.token)}
                    label={t("invites.decline")}
                    variant="outline"
                    fullWidthOnMobile
                  />
                  <InlineAction
                    action={acceptInvite.bind(null, invite.token)}
                    label={t("invites.join")}
                    variant="default"
                    fullWidthOnMobile
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
