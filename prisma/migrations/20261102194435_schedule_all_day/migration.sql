-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ScheduleItem" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false;
