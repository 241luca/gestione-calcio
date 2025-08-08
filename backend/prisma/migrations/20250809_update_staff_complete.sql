-- AlterTable Staff per aggiungere tutti i campi mancanti
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "fiscalCode" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "birthPlace" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'Italiana';
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "staffRole" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "specialization" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "contractType" TEXT DEFAULT 'VOLUNTEER';
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "contractStart" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "paymentFrequency" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "teamIds" TEXT[];
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "primaryTeamId" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canAccessSystem" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canManageAthletes" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canManagePayments" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canManageDocuments" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canViewReports" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canSendNotifications" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "hasCriminalCheck" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "criminalCheckDate" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "criminalCheckExpiry" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "hasMedicalCertificate" BOOLEAN DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "medicalCertificateDate" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "medicalCertificateExpiry" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "bloodType" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "medicalNotes" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Update role to staffRole if exists
UPDATE "staff" SET "staffRole" = "role" WHERE "staffRole" IS NULL AND "role" IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "staff_userId_idx" ON "staff"("userId");
CREATE INDEX IF NOT EXISTS "staff_staffRole_idx" ON "staff"("staffRole");
CREATE INDEX IF NOT EXISTS "staff_status_idx" ON "staff"("status");
CREATE INDEX IF NOT EXISTS "staff_fiscalCode_idx" ON "staff"("fiscalCode");
CREATE INDEX IF NOT EXISTS "staff_primaryTeamId_idx" ON "staff"("primaryTeamId");
