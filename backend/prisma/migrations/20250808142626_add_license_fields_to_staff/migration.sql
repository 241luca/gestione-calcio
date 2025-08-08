-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "qualifications" TEXT;
