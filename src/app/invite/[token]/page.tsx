import Link from "next/link";
import { redirect } from "next/navigation";
import { InlineAction } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvite, declineInvite } from "@/lib/actions/trips";
import { formatDateLong } from "@/lib/dates";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: { trip: true },
  });
  const invalid = !invite || invite.status !== "PENDING" || invite.expiresAt < new Date();
  const emailMatches = invite?.email === session.user.email?.toLowerCase();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{invalid ? "Invite unavailable" : invite.trip.name}</CardTitle>
          <CardDescription>
            {invalid
              ? "This link was already used, declined, or has expired."
              : `${formatDateLong(invite.trip.startDate)} – ${formatDateLong(invite.trip.endDate)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!invalid && !emailMatches ? (
            <p className="text-sm">
              This invite was sent to {invite.email}. You are signed in as {session.user.email}.
            </p>
          ) : null}
          {!invalid && emailMatches ? (
            <div className="flex gap-2">
              <InlineAction action={acceptInvite.bind(null, token)} label="Join trip" />
              <InlineAction action={declineInvite.bind(null, token)} label="Decline" variant="outline" />
            </div>
          ) : null}
          <Button nativeButton={false} variant="outline" render={<Link href="/trips" />}>
            Back to trips
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
