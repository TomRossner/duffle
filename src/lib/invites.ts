import { Prisma } from "@prisma/client";
import { translatorFor } from "@/i18n/server";
import { prisma } from "@/lib/prisma";

export async function claimPendingInvites(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, locale: true },
  });
  const email = user?.emailVerified ? user.email.toLowerCase().trim() : "";
  if (!email || email.endsWith("@users.invalid")) return;

  const invites = await prisma.tripInvite.findMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: { trip: { select: { name: true } } },
  });

  for (const invite of invites) {
    const membership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: invite.tripId, userId } },
      select: { status: true },
    });
    if (membership?.status === "ACCEPTED") continue;
    if (!membership) {
      await prisma.tripMember.create({
        data: { tripId: invite.tripId, userId, role: "MEMBER", status: "INVITED" },
      });
    }

    const href = `/invite/${invite.token}`;
    const existing = await prisma.notification.findFirst({
      where: { userId, kind: "INVITE", href },
      select: { id: true },
    });
    if (existing) continue;

    try {
      await prisma.notification.create({
        data: {
          userId,
          tripId: invite.tripId,
          kind: "INVITE",
          title: translatorFor(user?.locale, "notifications")("invited.title"),
          body: translatorFor(user?.locale, "notifications")("invited.body", { trip: invite.trip.name }),
          href,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
}
