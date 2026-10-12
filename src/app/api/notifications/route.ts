import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { claimPendingInvites } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await claimPendingInvites(session.user.id);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const unread = notifications.filter((item) => !item.readAt).length;
  return NextResponse.json(
    { notifications, unread },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
