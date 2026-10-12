import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSafeKey, readObject } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { key: parts } = await context.params;
  const key = parts.join("/");
  try {
    assertSafeKey(key);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  if (key.startsWith("closet/")) {
    const ownerId = key.split("/")[1];
    if (ownerId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } else if (key.startsWith("documents/")) {
    const tripId = key.split("/")[1];
    const membership = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: session.user.id } },
    });
    if (!membership || membership.status !== "ACCEPTED") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } else if (key.startsWith("identity/")) {
    const ownerId = key.split("/")[1];
    if (ownerId !== session.user.id) {
      const shared = await prisma.personalDocument.findFirst({
        where: {
          storageKey: key,
          userId: ownerId,
          attachments: {
            some: { trip: { members: { some: { userId: session.user.id, status: "ACCEPTED" } } } },
          },
        },
        select: { id: true },
      });
      if (!shared) return new NextResponse("Forbidden", { status: 403 });
    }
  } else if (key.startsWith("avatars/")) {
    const ownerId = key.split("/")[1];
    if (ownerId !== session.user.id) {
      const shared = await prisma.tripMember.findFirst({
        where: {
          userId: session.user.id,
          status: "ACCEPTED",
          trip: { members: { some: { userId: ownerId, status: "ACCEPTED" } } },
        },
        select: { tripId: true },
      });
      if (!shared) return new NextResponse("Forbidden", { status: 403 });
    }
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const file = await readObject(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
