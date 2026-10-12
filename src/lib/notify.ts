import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type TripNotice = {
  kind: string;
  title: string;
  body: string;
  href: string;
};

export async function notifyTrip(tripId: string, actorId: string, notice: TripNotice) {
  const members = await prisma.tripMember.findMany({
    where: { tripId, status: "ACCEPTED", userId: { not: actorId } },
    select: { userId: true },
  });
  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      tripId,
      actorId,
      kind: notice.kind,
      title: notice.title,
      body: notice.body,
      href: notice.href,
    })),
  });

  await sendPush(
    members.map((member) => member.userId),
    notice,
  );
}

async function sendPush(userIds: string[], notice: TripNotice) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@localhost",
    publicKey,
    privateKey,
  );

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ title: notice.title, body: notice.body, href: notice.href }),
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        }
      }
    }),
  );
}
