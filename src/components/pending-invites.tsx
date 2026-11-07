import { Mail } from "lucide-react";
import { InlineAction } from "@/components/action-form";
import { FlagStack } from "@/components/country-flag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countryName } from "@/lib/account-details";
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

  return (
    <Card className="ring-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-4" />
          </span>
          Invitations
          <Badge>{invites.length}</Badge>
        </CardTitle>
        <CardDescription>
          {invites.length === 1 ? "A trip is waiting for you to join." : "Trips waiting for you to join."}
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
                  <p className="flex flex-wrap items-center gap-2 text-base font-medium">
                    {trip.countries.length > 0 ? (
                      <FlagStack codes={trip.countries} label={trip.countries.map(countryName).join(", ")} />
                    ) : null}
                    <span className="min-w-0 break-words">{trip.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? "day" : "days"} ·{" "}
                    {travelers} {travelers === 1 ? "traveler" : "travelers"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invited by <span className="font-medium text-foreground">{trip.owner.name}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <InlineAction
                    action={declineInvite.bind(null, invite.token)}
                    label="Decline"
                    variant="outline"
                    fullWidthOnMobile
                  />
                  <InlineAction
                    action={acceptInvite.bind(null, invite.token)}
                    label="Join trip"
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
