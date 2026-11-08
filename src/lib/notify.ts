import webpush from "web-push";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { translatorFor } from "@/i18n/server";
import type { Values } from "@/i18n/translate";
import { prisma } from "@/lib/prisma";

type Notices = Messages["notifications"];

/** The notifications messages that have a title and a body. */
export type NoticeMessage = {
  [K in keyof Notices]: Notices[K] extends { title: unknown; body: unknown } ? K : never;
}[keyof Notices];

export type TripNotice = {
  kind: string;
  href: string;
  message: NoticeMessage;
  /**
   * Filled into the message. `name` is who did it; an empty name reads as "A traveler". A function gets
   * the recipient's language, for values that are text themselves.
   */
  values?: Values | ((locale: Locale) => Values);
};

/** The title and body in one recipient's language. Stored as text, so each person gets their own. */
function render(notice: TripNotice, locale: string | null | undefined) {
  const t = translatorFor(locale, "notifications");
  const values = { ...(typeof notice.values === "function" ? notice.values(t.locale) : notice.values) };
  if ("name" in values && !values.name) values.name = t("someone");
  return {
    title: t.dynamic(`${notice.message}.title`, values),
    body: t.dynamic(`${notice.message}.body`, values),
  };
}

async function recipients(userIds: string[]) {
  return prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, locale: true } });
}

export async function notifyTrip(tripId: string, actorId: string, notice: TripNotice) {
  const members = await prisma.tripMember.findMany({
    where: { tripId, status: "ACCEPTED", userId: { not: actorId } },
    select: { user: { select: { id: true, locale: true } } },
  });
  if (members.length === 0) return;
  await deliver(
    tripId,
    members.map((member) => member.user),
    notice,
    actorId,
  );
}

/** Notifies these users about something no traveler did, such as an airline changing a flight. */
export async function notifyUsers(tripId: string, userIds: string[], notice: TripNotice) {
  if (userIds.length === 0) return;
  await deliver(tripId, await recipients(userIds), notice);
}

async function deliver(
  tripId: string,
  users: { id: string; locale: string | null }[],
  notice: TripNotice,
  actorId?: string,
) {
  const messages = new Map(users.map((user) => [user.id, render(notice, user.locale)]));
  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      tripId,
      ...(actorId ? { actorId } : {}),
      kind: notice.kind,
      ...messages.get(user.id)!,
      href: notice.href,
    })),
  });
  await sendPush(messages, notice.href);
}

async function sendPush(messages: Map<string, { title: string; body: string }>, href: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@localhost",
    publicKey,
    privateKey,
  );

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: [...messages.keys()] } },
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const message = messages.get(subscription.userId);
      if (!message) return;
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ ...message, href }),
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
