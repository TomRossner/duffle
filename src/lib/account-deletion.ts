import type { Prisma } from "@prisma/client";
import { pickSuccessor } from "@/lib/account-departure";

async function handOffTrip(tx: Prisma.TransactionClient, tripId: string, userId: string, successorId: string) {
  await tx.trip.update({ where: { id: tripId }, data: { ownerId: successorId } });
  await tx.tripMember.updateMany({
    where: { tripId, userId: successorId },
    data: { role: "ADMIN", status: "ACCEPTED" },
  });
  await tx.document.updateMany({ where: { tripId, userId }, data: { userId: successorId } });
  await tx.insurancePolicy.updateMany({ where: { tripId, userId }, data: { userId: successorId } });
}

export async function releaseOwnedTrips(tx: Prisma.TransactionClient, userId: string) {
  const owned = await tx.trip.findMany({ where: { ownerId: userId }, select: { id: true } });
  for (const trip of owned) {
    const others = await tx.tripMember.findMany({
      where: { tripId: trip.id, userId: { not: userId }, status: "ACCEPTED" },
      select: { id: true, userId: true, role: true },
    });
    const successor = pickSuccessor(others);
    if (!successor) {
      await tx.trip.delete({ where: { id: trip.id } });
      continue;
    }
    await handOffTrip(tx, trip.id, userId, successor.userId);
  }
}

async function reassignRemainingRecords(tx: Prisma.TransactionClient, userId: string) {
  const documents = await tx.document.findMany({ where: { userId }, select: { id: true, tripId: true } });
  for (const document of documents) {
    const trip = await tx.trip.findUnique({ where: { id: document.tripId }, select: { ownerId: true } });
    if (trip && trip.ownerId !== userId) {
      await tx.document.update({ where: { id: document.id }, data: { userId: trip.ownerId } });
    }
  }

  const policies = await tx.insurancePolicy.findMany({ where: { userId }, select: { id: true, tripId: true } });
  for (const policy of policies) {
    const trip = await tx.trip.findUnique({ where: { id: policy.tripId }, select: { ownerId: true } });
    if (trip && trip.ownerId !== userId) {
      await tx.insurancePolicy.update({ where: { id: policy.id }, data: { userId: trip.ownerId } });
    }
  }
}

async function wipePrivateRows(tx: Prisma.TransactionClient, userId: string) {
  await tx.personalDocument.deleteMany({ where: { userId } });
  await tx.packingChoice.deleteMany({ where: { userId } });
  await tx.luggage.deleteMany({ where: { userId } });
  await tx.closetItem.deleteMany({ where: { userId } });
  await tx.pushSubscription.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });
  await tx.authToken.deleteMany({ where: { userId } });
}

export async function deleteOrAnonymizeUser(tx: Prisma.TransactionClient, userId: string) {
  await releaseOwnedTrips(tx, userId);
  await reassignRemainingRecords(tx, userId);
  await wipePrivateRows(tx, userId);

  const financial = await tx.expense.count({
    where: { OR: [{ paidById: userId }, { shares: { some: { userId } } }] },
  });
  if (financial > 0) {
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@users.invalid`,
        name: "Deleted traveler",
        passwordHash: null,
        imageKey: null,
        gender: null,
        birthDate: null,
        phone: null,
        country: null,
        address: null,
        city: null,
        postalCode: null,
        emailVerified: null,
        sessionVersion: { increment: 1 },
      },
    });
    return;
  }

  await tx.user.delete({ where: { id: userId } });
}
