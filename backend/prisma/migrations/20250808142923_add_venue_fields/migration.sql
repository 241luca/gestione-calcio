-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "isHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;
