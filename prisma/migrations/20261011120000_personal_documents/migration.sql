-- CreateTable
CREATE TABLE "PersonalDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDocumentAttachment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "personalDocumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripDocumentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalDocument_userId_idx" ON "PersonalDocument"("userId");

-- CreateIndex
CREATE INDEX "TripDocumentAttachment_tripId_idx" ON "TripDocumentAttachment"("tripId");

-- CreateIndex
CREATE INDEX "TripDocumentAttachment_personalDocumentId_idx" ON "TripDocumentAttachment"("personalDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "TripDocumentAttachment_tripId_personalDocumentId_key" ON "TripDocumentAttachment"("tripId", "personalDocumentId");

-- AddForeignKey
ALTER TABLE "PersonalDocument" ADD CONSTRAINT "PersonalDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDocumentAttachment" ADD CONSTRAINT "TripDocumentAttachment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDocumentAttachment" ADD CONSTRAINT "TripDocumentAttachment_personalDocumentId_fkey" FOREIGN KEY ("personalDocumentId") REFERENCES "PersonalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
