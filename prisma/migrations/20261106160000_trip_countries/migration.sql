-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "countries" TEXT[] DEFAULT ARRAY[]::TEXT[];
