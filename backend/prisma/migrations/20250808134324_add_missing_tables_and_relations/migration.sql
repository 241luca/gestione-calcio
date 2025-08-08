/*
  Warnings:

  - You are about to drop the column `contractEndDate` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `imageRightsConsent` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `needsTransport` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `socialMediaConsent` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `reminder1Day` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `reminder30Days` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `reminder7Days` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedById` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedRecovery` on the `injuries` table. All the data in the column will be lost.
  - You are about to drop the column `absenceReason` on the `match_rosters` table. All the data in the column will be lost.
  - You are about to drop the column `attended` on the `match_rosters` table. All the data in the column will be lost.
  - You are about to drop the column `convocationStatus` on the `match_rosters` table. All the data in the column will be lost.
  - You are about to drop the column `responseDate` on the `match_rosters` table. All the data in the column will be lost.
  - You are about to drop the column `incomeGenerated` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `referees` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `spectators` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `weatherConditions` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceUrl` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `reminderDate` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSent` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `assistantCoach` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `coach` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `communications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `performance_scores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_routes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_schedules` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `injuries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `payment_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "communications" DROP CONSTRAINT "communications_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "communications" DROP CONSTRAINT "communications_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_verifiedById_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_athleteId_fkey";

-- DropForeignKey
ALTER TABLE "performance_scores" DROP CONSTRAINT "performance_scores_athleteId_fkey";

-- DropForeignKey
ALTER TABLE "performance_scores" DROP CONSTRAINT "performance_scores_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "staff_members" DROP CONSTRAINT "staff_members_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "staff_members" DROP CONSTRAINT "staff_members_teamId_fkey";

-- DropForeignKey
ALTER TABLE "transport_bookings" DROP CONSTRAINT "transport_bookings_athleteId_fkey";

-- DropForeignKey
ALTER TABLE "transport_bookings" DROP CONSTRAINT "transport_bookings_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "transport_routes" DROP CONSTRAINT "transport_routes_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "transport_schedules" DROP CONSTRAINT "transport_schedules_matchId_fkey";

-- DropForeignKey
ALTER TABLE "transport_schedules" DROP CONSTRAINT "transport_schedules_routeId_fkey";

-- DropForeignKey
ALTER TABLE "transport_schedules" DROP CONSTRAINT "transport_schedules_sessionId_fkey";

-- DropIndex
DROP INDEX "positions_code_key";

-- AlterTable
ALTER TABLE "athletes" DROP COLUMN "contractEndDate",
DROP COLUMN "imageRightsConsent",
DROP COLUMN "needsTransport",
DROP COLUMN "photoUrl",
DROP COLUMN "registrationNumber",
DROP COLUMN "socialMediaConsent",
ADD COLUMN     "footPreference" TEXT,
ADD COLUMN     "hasTransportService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "weight" INTEGER;

-- AlterTable
ALTER TABLE "competitions" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "reminder1Day",
DROP COLUMN "reminder30Days",
DROP COLUMN "reminder7Days",
DROP COLUMN "uploadedById",
DROP COLUMN "verifiedById",
ADD COLUMN     "uploadedBy" TEXT,
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "injuries" DROP COLUMN "estimatedRecovery",
ADD COLUMN     "bodyPart" TEXT,
ADD COLUMN     "estimatedRecoveryDays" INTEGER,
ADD COLUMN     "injuryType" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "match_rosters" DROP COLUMN "absenceReason",
DROP COLUMN "attended",
DROP COLUMN "convocationStatus",
DROP COLUMN "responseDate",
ADD COLUMN     "isPresent" BOOLEAN,
ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "incomeGenerated",
DROP COLUMN "referees",
DROP COLUMN "spectators",
DROP COLUMN "venue",
DROP COLUMN "weatherConditions",
ADD COLUMN     "isHome" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "matchType" TEXT NOT NULL DEFAULT 'CAMPIONATO',
ADD COLUMN     "opponentName" TEXT;

-- AlterTable
ALTER TABLE "payment_types" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "invoiceNumber",
DROP COLUMN "invoiceUrl",
DROP COLUMN "reminderDate",
DROP COLUMN "reminderSent",
DROP COLUMN "transactionId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paidAmount" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "positions" DROP COLUMN "code",
ADD COLUMN     "abbreviation" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "permissions" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "assistantCoach",
DROP COLUMN "coach",
ADD COLUMN     "coachId" TEXT;

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "hasLighting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "surface" TEXT,
ALTER COLUMN "type" SET DEFAULT 'HOME';

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "communications";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "performance_scores";

-- DropTable
DROP TABLE "staff_members";

-- DropTable
DROP TABLE "transport_bookings";

-- DropTable
DROP TABLE "transport_routes";

-- DropTable
DROP TABLE "transport_schedules";

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "teamId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "qualification" TEXT,
    "startDate" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "amount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
