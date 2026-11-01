import { PackingBoard } from "@/components/packing-list";
import { prisma } from "@/lib/prisma";
import { requireTrip } from "@/lib/trip-access";

export const maxDuration = 60;

export default async function PackingPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { user } = await requireTrip(tripId);
  const [bags, closet, shared, members] = await Promise.all([
    prisma.luggage.findMany({
      where: { tripId, userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: { closetItem: { select: { slot: true } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.closetItem.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slot: true },
    }),
    prisma.sharedPackingItem.findMany({
      where: { tripId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        checks: {
          include: {
            user: { select: { id: true } },
            packingItem: { select: { packed: true } },
          },
        },
      },
    }),
    prisma.tripMember.findMany({
      where: { tripId, status: "ACCEPTED" },
      orderBy: { role: "asc" },
      select: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const packedByUser = new Map<string, number>();
  for (const item of shared) {
    for (const check of item.checks) {
      if (!check.packingItem?.packed) continue;
      packedByUser.set(check.user.id, (packedByUser.get(check.user.id) ?? 0) + 1);
    }
  }

  return (
    <PackingBoard
      tripId={tripId}
      bags={bags.map((bag) => ({
        id: bag.id,
        name: bag.name,
        kind: bag.kind,
        items: bag.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          packed: item.packed,
          closetItemId: item.closetItemId,
          slot: item.closetItem?.slot ?? null,
          note: item.note,
        })),
      }))}
      closet={closet}
      sharedItems={shared.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        packed: item.checks.some((check) => check.user.id === user.id && check.packingItem?.packed),
        packedCount: item.checks.filter((check) => check.packingItem?.packed).length,
      }))}
      travelers={members.map((member) => ({
        id: member.user.id,
        name: member.user.name ?? "Traveler",
        packed: packedByUser.get(member.user.id) ?? 0,
      }))}
      dev={process.env.NODE_ENV !== "production"}
    />
  );
}
