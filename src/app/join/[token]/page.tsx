import Link from "next/link";
import { redirect } from "next/navigation";
import { InlineAction } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptJoin } from "@/lib/actions/trips";
import { formatDateLong } from "@/lib/dates";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${token}`);
  }

  const trip = await prisma.trip.findUnique({ where: { joinToken: token } });
  if (!trip) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Link unavailable</CardTitle>
            <CardDescription>This join link does not match a trip.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId: session.user.id } },
  });
  if (membership?.status === "ACCEPTED") redirect(`/trips/${trip.id}`);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{trip.name}</CardTitle>
          <CardDescription>
            {formatDateLong(trip.startDate)} – {formatDateLong(trip.endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">Join as a traveler. You can edit the plan with everyone else.</p>
          <div className="flex gap-2">
            <InlineAction action={acceptJoin.bind(null, token)} label="Join trip" />
            <Button nativeButton={false} variant="outline" render={<Link href="/trips" />}>
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
