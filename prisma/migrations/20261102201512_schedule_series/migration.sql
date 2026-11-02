-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "ScheduleItem" ADD COLUMN     "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "Activity_seriesId_idx" ON "Activity"("seriesId");

-- CreateIndex
CREATE INDEX "ScheduleItem_seriesId_idx" ON "ScheduleItem"("seriesId");
