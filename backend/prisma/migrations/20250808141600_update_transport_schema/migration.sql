/*
  Warnings:

  - You are about to drop the column `arrivalTime` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfWeek` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `departureTime` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `driverName` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `driverPhone` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `transport_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `transport_schedules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[scheduleId,athleteId]` on the table `transport_bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pickupTime` to the `transport_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "transport_bookings_scheduleId_athleteId_bookingDate_key";

-- AlterTable
ALTER TABLE "transport_bookings" ALTER COLUMN "bookingDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "transport_routes" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "driver" TEXT,
ADD COLUMN     "vehiclePlate" TEXT,
ALTER COLUMN "startPoint" DROP NOT NULL,
ALTER COLUMN "endPoint" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transport_schedules" DROP COLUMN "arrivalTime",
DROP COLUMN "capacity",
DROP COLUMN "dayOfWeek",
DROP COLUMN "departureTime",
DROP COLUMN "driverName",
DROP COLUMN "driverPhone",
DROP COLUMN "isActive",
DROP COLUMN "vehicleType",
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "pickupTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "returnTime" TIMESTAMP(3),
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE UNIQUE INDEX "transport_bookings_scheduleId_athleteId_key" ON "transport_bookings"("scheduleId", "athleteId");

-- AddForeignKey
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
