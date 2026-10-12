import { ClosetAddButton } from "@/components/closet-item";
import { ClosetBoard } from "@/components/closet-board";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export default async function ClosetPage() {
  const user = await requireUser();
  const items = await prisma.closetItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Closet</h1>
          <p className="text-sm text-muted-foreground">
            Only you can see these items. Trips use them to suggest what to pack.
          </p>
        </div>
        <ClosetAddButton />
      </div>
      <ClosetBoard
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          imageUrl: item.imageUrl ?? "",
          src: item.imageKey ? `/api/files/${item.imageKey}` : item.imageUrl,
          slot: item.slot,
          quantity: item.quantity,
          tempMin: item.tempMin == null ? "" : String(item.tempMin),
          tempMax: item.tempMax == null ? "" : String(item.tempMax),
          conditions: item.conditions,
          activities: item.activities,
          goreTex: item.goreTex,
          driFit: item.driFit,
          hasImage: Boolean(item.imageKey || item.imageUrl),
        }))}
      />
    </div>
  );
}
