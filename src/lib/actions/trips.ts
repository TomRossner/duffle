"use server";

import { getT, translatorFor } from "@/i18n/server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readTripCountries } from "@/lib/account-details";
import { CURRENCIES } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { claimPendingInvites } from "@/lib/invites";
import { notifyTrip } from "@/lib/notify";
import { requireTrip, requireUser, requireVerifiedUser } from "@/lib/trip-access";

export async function createTrip(_: unknown, formData: FormData) {
  const t = await getT("trips");
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const baseCurrency = String(formData.get("baseCurrency") ?? "USD").toUpperCase();
  const coverNote = String(formData.get("coverNote") ?? "").trim() || null;
  const countries = readTripCountries(formData);

  if (name.length < 2) return { error: t("errors.name") };
  if (!startDate || !endDate) return { error: t("errors.dates") };
  if (endDate < startDate) return { error: t("errors.endBeforeStart") };
  if (!CURRENCIES.includes(baseCurrency as (typeof CURRENCIES)[number])) {
    return { error: t("errors.currency") };
  }

  const trip = await prisma.trip.create({
    data: {
      name,
      startDate,
      endDate,
      baseCurrency,
      countries,
      coverNote,
      ownerId: user.id,
      joinToken: randomBytes(24).toString("hex"),
      members: {
        create: { userId: user.id, role: "ADMIN", status: "ACCEPTED" },
      },
    },
  });

  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, _: unknown, formData: FormData) {
  const t = await getT("trips");
  await requireTrip(tripId);

  const name = String(formData.get("name") ?? "").trim();
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const coverNote = String(formData.get("coverNote") ?? "").trim() || null;
  const countries = readTripCountries(formData);

  if (name.length < 2) return { error: t("errors.name") };
  if (!startDate || !endDate) return { error: t("errors.dates") };
  if (endDate < startDate) return { error: t("errors.endBeforeStart") };

  await prisma.trip.update({
    where: { id: tripId },
    data: { name, startDate, endDate, countries, coverNote },
  });
  revalidatePath(`/trips/${tripId}`, "layout");
  return { ok: true };
}

export async function deleteTrip(tripId: string) {
  const t = await getT("trips");
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: t("errors.adminDelete") };
  await prisma.trip.delete({ where: { id: tripId } });
  redirect("/trips");
}

export async function createInvite(tripId: string, _: unknown, formData: FormData) {
  const t = await getT("trips");
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: t("errors.adminInvite") };

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t("errors.email") };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: existingUser.id } },
    });
    if (already?.status === "ACCEPTED") return { error: t("errors.alreadyOn") };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  const invite = await prisma.tripInvite.create({
    data: {
      tripId,
      email,
      token: randomBytes(24).toString("hex"),
      expiresAt,
    },
  });

  if (existingUser) await claimPendingInvites(existingUser.id);

  revalidatePath(`/trips/${tripId}`);
  return { token: invite.token };
}

export async function acceptInvite(token: string) {
  const t = await getT("trips");
  const user = await requireVerifiedUser();
  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return { error: t("errors.inviteInvalid") };
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: t("errors.wrongEmail", { email: invite.email }) };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tripInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
    await tx.tripMember.upsert({
      where: { tripId_userId: { tripId: invite.tripId, userId: user.id } },
      update: { status: "ACCEPTED" },
      create: { tripId: invite.tripId, userId: user.id, role: "MEMBER", status: "ACCEPTED" },
    });
  });

  const trip = await prisma.trip.findUnique({ where: { id: invite.tripId } });
  await notifyTrip(invite.tripId, user.id, {
    kind: "JOIN",
    message: "joined",
    values: (locale) => ({
      name: user.name ?? "",
      trip: trip?.name ?? translatorFor(locale, "notifications")("theTrip"),
    }),
    href: `/trips/${invite.tripId}`,
  });
  redirect(`/trips/${invite.tripId}`);
}

export async function acceptJoin(token: string) {
  const t = await getT("trips");
  const user = await requireVerifiedUser();
  const trip = await prisma.trip.findUnique({ where: { joinToken: token } });
  if (!trip) return { error: t("errors.linkInvalid") };

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId: user.id } },
  });
  if (existing?.status === "ACCEPTED") redirect(`/trips/${trip.id}`);

  await prisma.tripMember.upsert({
    where: { tripId_userId: { tripId: trip.id, userId: user.id } },
    update: { status: "ACCEPTED" },
    create: { tripId: trip.id, userId: user.id, role: "MEMBER", status: "ACCEPTED" },
  });

  await notifyTrip(trip.id, user.id, {
    kind: "JOIN",
    message: "joined",
    values: { name: user.name ?? "", trip: trip.name },
    href: `/trips/${trip.id}`,
  });
  redirect(`/trips/${trip.id}`);
}

export async function declineInvite(token: string) {
  const t = await getT("trips");
  const user = await requireVerifiedUser();
  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite || invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: t("errors.inviteInvalid") };
  }

  await prisma.tripInvite.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
  if (user.id) {
    await prisma.tripMember.deleteMany({
      where: { tripId: invite.tripId, userId: user.id, status: "INVITED" },
    });
  }
  redirect("/trips");
}

export async function makeAdmin(tripId: string, userId: string) {
  const t = await getT("trips");
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: t("errors.adminPromote") };

  const updated = await prisma.tripMember.updateMany({
    where: { tripId, userId, status: "ACCEPTED" },
    data: { role: "ADMIN" },
  });
  if (updated.count === 0) return { error: t("errors.notOnTrip") };

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function removeMember(tripId: string, userId: string) {
  const t = await getT("trips");
  const { membership, trip } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: t("errors.adminRemove") };
  if (userId === trip.ownerId) return { error: t("errors.ownerStays") };

  await prisma.tripMember.deleteMany({ where: { tripId, userId } });
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
