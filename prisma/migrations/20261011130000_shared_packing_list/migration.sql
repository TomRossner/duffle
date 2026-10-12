-- CreateTable
CREATE TABLE "SharedPackingItem" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PackingCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedPackingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedPackingCheck" (
    "id" TEXT NOT NULL,
    "sharedItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packingItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedPackingCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedPackingItem_tripId_idx" ON "SharedPackingItem"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedPackingCheck_packingItemId_key" ON "SharedPackingCheck"("packingItemId");

-- CreateIndex
CREATE INDEX "SharedPackingCheck_userId_idx" ON "SharedPackingCheck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedPackingCheck_sharedItemId_userId_key" ON "SharedPackingCheck"("sharedItemId", "userId");

-- AddForeignKey
ALTER TABLE "SharedPackingItem" ADD CONSTRAINT "SharedPackingItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPackingCheck" ADD CONSTRAINT "SharedPackingCheck_sharedItemId_fkey" FOREIGN KEY ("sharedItemId") REFERENCES "SharedPackingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPackingCheck" ADD CONSTRAINT "SharedPackingCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPackingCheck" ADD CONSTRAINT "SharedPackingCheck_packingItemId_fkey" FOREIGN KEY ("packingItemId") REFERENCES "PackingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
