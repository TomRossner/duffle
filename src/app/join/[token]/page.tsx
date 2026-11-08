import { redirect } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { InlineAction } from "@/components/action-form";
import { CardContent } from "@/components/ui/card";
import { InviteShell, TripInviteCard } from "@/components/trip-invite-card";
import { acceptJoin } from "@/lib/actions/trips";
import { getT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptedMembers } from "@/lib/trip-access";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  const t = await getT("trips");
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${token}`);
  }

  const trip = await prisma.trip.findUnique({
    where: { joinToken: token },
    include: { owner: { select: { name: true } } },
  });
  if (!trip) {
    return (
      <InviteShell>
        <CardContent className="grid justify-items-center gap-2 py-4 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LinkIcon className="size-5" />
          </span>
          <h1 className="text-lg font-semibold">{t("invitePage.linkUnavailableTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("invitePage.linkUnavailableBody")}
          </p>
        </CardContent>
      </InviteShell>
    );
  }

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId: session.user.id } },
  });
  if (membership?.status === "ACCEPTED") redirect(`/trips/${trip.id}`);

  const members = await acceptedMembers(trip.id);

  return (
    <TripInviteCard
      eyebrow={t("invitePage.invitedYou", { name: trip.owner.name })}
      trip={trip}
      travelers={members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        imageKey: member.user.imageKey,
      }))}
    >
      <div className="grid gap-2">
        <p className="text-center text-sm text-muted-foreground">
          {t("invitePage.joinHint")}
        </p>
        <InlineAction action={acceptJoin.bind(null, token)} label={t("invites.join")} variant="default" fullWidth />
      </div>
    </TripInviteCard>
  );
}
