"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURRENCIES } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { claimPendingInvites } from "@/lib/invites";
import { notifyTrip } from "@/lib/notify";
import { requireTrip, requireUser, requireVerifiedUser } from "@/lib/trip-access";

export async function createTrip(_: unknown, formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const baseCurrency = String(formData.get("baseCurrency") ?? "USD").toUpperCase();
  const coverNote = String(formData.get("coverNote") ?? "").trim() || null;

  if (name.length < 2) return { error: "Give the trip a name." };
  if (!startDate || !endDate) return { error: "Choose start and end dates." };
  if (endDate < startDate) return { error: "The end date must be on or after the start date." };
  if (!CURRENCIES.includes(baseCurrency as (typeof CURRENCIES)[number])) {
    return { error: "Choose a base currency." };
  }

  const trip = await prisma.trip.create({
    data: {
      name,
      startDate,
      endDate,
      baseCurrency,
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
  await requireTrip(tripId);

  const name = String(formData.get("name") ?? "").trim();
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));
  const coverNote = String(formData.get("coverNote") ?? "").trim() || null;

  if (name.length < 2) return { error: "Give the trip a name." };
  if (!startDate || !endDate) return { error: "Choose start and end dates." };
  if (endDate < startDate) return { error: "The end date must be on or after the start date." };

  await prisma.trip.update({
    where: { id: tripId },
    data: { name, startDate, endDate, coverNote },
  });
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function deleteTrip(tripId: string) {
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: "Only an admin can delete the trip." };
  await prisma.trip.delete({ where: { id: tripId } });
  redirect("/trips");
}

export async function createInvite(tripId: string, _: unknown, formData: FormData) {
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: "Only an admin can invite travelers by email." };

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: existingUser.id } },
    });
    if (already?.status === "ACCEPTED") return { error: "That person is already on this trip." };
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
  const user = await requireVerifiedUser();
  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return { error: "This invite is no longer valid." };
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. Sign in with that email.` };
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
    title: "New traveler",
    body: `${user.name ?? "A traveler"} joined ${trip?.name ?? "the trip"}.`,
    href: `/trips/${invite.tripId}`,
  });
  redirect(`/trips/${invite.tripId}`);
}

export async function acceptJoin(token: string) {
  const user = await requireVerifiedUser();
  const trip = await prisma.trip.findUnique({ where: { joinToken: token } });
  if (!trip) return { error: "This link is no longer valid." };

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
    title: "New traveler",
    body: `${user.name ?? "A traveler"} joined ${trip.name}.`,
    href: `/trips/${trip.id}`,
  });
  redirect(`/trips/${trip.id}`);
}

export async function declineInvite(token: string) {
  const user = await requireVerifiedUser();
  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite || invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "This invite is no longer valid." };
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
  const { membership } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: "Only an admin can add another admin." };

  const updated = await prisma.tripMember.updateMany({
    where: { tripId, userId, status: "ACCEPTED" },
    data: { role: "ADMIN" },
  });
  if (updated.count === 0) return { error: "That traveler is not on this trip." };

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function removeMember(tripId: string, userId: string) {
  const { membership, trip } = await requireTrip(tripId);
  if (membership.role !== "ADMIN") return { error: "Only an admin can remove travelers." };
  if (userId === trip.ownerId) return { error: "The admin who created the trip stays on it." };

  await prisma.tripMember.deleteMany({ where: { tripId, userId } });
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
