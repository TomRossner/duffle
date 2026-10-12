-- CreateEnum
CREATE TYPE "LuggageKind" AS ENUM ('PACK', 'BAG', 'TROLLEY', 'LUGGAGE');

-- CreateEnum
CREATE TYPE "PackingCategory" AS ENUM ('CLOTHES', 'TOILETRIES', 'ELECTRONICS', 'DOCUMENTS', 'HEALTH', 'ACCESSORIES', 'OTHER');

-- CreateTable
CREATE TABLE "Luggage" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LuggageKind" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Luggage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingItem" (
    "id" TEXT NOT NULL,
    "luggageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PackingCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "packed" BOOLEAN NOT NULL DEFAULT false,
    "closetItemId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Luggage_tripId_userId_idx" ON "Luggage"("tripId", "userId");

-- CreateIndex
CREATE INDEX "PackingItem_luggageId_idx" ON "PackingItem"("luggageId");

-- CreateIndex
CREATE INDEX "PackingItem_closetItemId_idx" ON "PackingItem"("closetItemId");

-- AddForeignKey
ALTER TABLE "Luggage" ADD CONSTRAINT "Luggage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Luggage" ADD CONSTRAINT "Luggage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItem" ADD CONSTRAINT "PackingItem_luggageId_fkey" FOREIGN KEY ("luggageId") REFERENCES "Luggage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItem" ADD CONSTRAINT "PackingItem_closetItemId_fkey" FOREIGN KEY ("closetItemId") REFERENCES "ClosetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
