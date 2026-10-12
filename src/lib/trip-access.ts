import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireTrip(tripId: string) {
  const user = await requireUser();
  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: user.id } },
    include: { trip: true },
  });

  if (!membership || membership.status !== "ACCEPTED") notFound();

  return { user, membership, trip: membership.trip };
}

export async function acceptedMembers(tripId: string) {
  return prisma.tripMember.findMany({
    where: { tripId, status: "ACCEPTED" },
    include: { user: { select: { id: true, name: true, email: true, imageKey: true } } },
    orderBy: { role: "asc" },
  });
}
