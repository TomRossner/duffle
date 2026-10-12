import { InlineAction } from "@/components/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvite, declineInvite } from "@/lib/actions/trips";
import { formatDateLong } from "@/lib/dates";
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
    include: { trip: true },
    orderBy: { createdAt: "desc" },
  });
  if (invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>Trips waiting for you to join.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium">{invite.trip.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateLong(invite.trip.startDate)} – {formatDateLong(invite.trip.endDate)}
                </p>
              </div>
              <span className="flex flex-wrap gap-2">
                <InlineAction action={acceptInvite.bind(null, invite.token)} label="Join trip" variant="secondary" />
                <InlineAction action={declineInvite.bind(null, invite.token)} label="Decline" variant="outline" />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
