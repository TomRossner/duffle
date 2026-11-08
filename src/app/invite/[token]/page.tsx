import { redirect } from "next/navigation";
import { CircleAlert, LinkIcon } from "lucide-react";
import { InlineAction } from "@/components/action-form";
import { CardContent } from "@/components/ui/card";
import { InviteShell, TripInviteCard } from "@/components/trip-invite-card";
import { acceptInvite, declineInvite } from "@/lib/actions/trips";
import { getT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptedMembers } from "@/lib/trip-access";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  const t = await getT("trips");
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: { trip: { include: { owner: { select: { name: true } } } } },
  });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return (
      <InviteShell>
        <CardContent className="grid justify-items-center gap-2 py-4 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LinkIcon className="size-5" />
          </span>
          <h1 className="text-lg font-semibold">{t("invitePage.unavailableTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("invitePage.unavailableBody")}
          </p>
        </CardContent>
      </InviteShell>
    );
  }

  const members = await acceptedMembers(invite.tripId);
  const emailMatches = invite.email === session.user.email?.toLowerCase();

  return (
    <TripInviteCard
      eyebrow={t("invitePage.invitedYou", { name: invite.trip.owner.name })}
      trip={invite.trip}
      travelers={members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        imageKey: member.user.imageKey,
      }))}
    >
      {emailMatches ? (
        <div className="grid gap-2">
          <InlineAction action={acceptInvite.bind(null, token)} label={t("invites.join")} variant="default" fullWidth />
          <InlineAction action={declineInvite.bind(null, token)} label={t("invites.decline")} variant="outline" fullWidth />
        </div>
      ) : (
        <div className="flex gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="min-w-0 break-words">
            {t.rich("invitePage.wrongEmail", {
              email: invite.email,
              current: session.user.email ?? "",
              b: (chunks) => <span className="font-medium">{chunks}</span>,
            })}
          </p>
        </div>
      )}
    </TripInviteCard>
  );
}
