-- Aggiungi modello Staff completo se non esiste
-- Questo file aggiunge il modello Staff con tutti i campi necessari

-- Crea tabella Staff se non esiste
CREATE TABLE IF NOT EXISTS "Staff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    
    -- Dati anagrafici
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fiscalCode" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "nationality" TEXT DEFAULT 'Italiana',
    
    -- Contatti
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "zipCode" TEXT,
    
    -- Informazioni professionali
    "staffRole" TEXT NOT NULL, -- COACH, ASSISTANT_COACH, MEDICAL, PHYSIOTHERAPIST, MANAGER, DIRECTOR, SECRETARY, OTHER
    "qualification" TEXT, -- Qualifica professionale
    "licenseNumber" TEXT, -- Numero patentino/licenza
    "licenseType" TEXT, -- Tipo patentino (UEFA A, UEFA B, etc.)
    "licenseExpiry" TIMESTAMP(3), -- Scadenza patentino
    "specialization" TEXT, -- Specializzazione
    
    -- Informazioni contrattuali
    "contractType" TEXT DEFAULT 'VOLUNTEER', -- EMPLOYEE, CONTRACTOR, VOLUNTEER
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "paymentFrequency" TEXT, -- MONTHLY, WEEKLY, HOURLY
    
    -- Assegnazioni
    "teamIds" TEXT[], -- Array di ID team assegnati
    "primaryTeamId" TEXT, -- Team principale
    
    -- Permessi e accessi
    "permissions" JSONB DEFAULT '{}', -- Permessi specifici
    "canAccessSystem" BOOLEAN DEFAULT false,
    "canManageAthletes" BOOLEAN DEFAULT false,
    "canManagePayments" BOOLEAN DEFAULT false,
    "canManageDocuments" BOOLEAN DEFAULT false,
    "canViewReports" BOOLEAN DEFAULT false,
    "canSendNotifications" BOOLEAN DEFAULT false,
    
    -- Documenti e certificazioni
    "hasCriminalCheck" BOOLEAN DEFAULT false,
    "criminalCheckDate" TIMESTAMP(3),
    "criminalCheckExpiry" TIMESTAMP(3),
    "hasMedicalCertificate" BOOLEAN DEFAULT false,
    "medicalCertificateDate" TIMESTAMP(3),
    "medicalCertificateExpiry" TIMESTAMP(3),
    
    -- Informazioni emergenza
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "medicalNotes" TEXT,
    
    -- Stato e metadata
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED, TERMINATED
    "profilePhoto" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- Crea indici
CREATE INDEX IF NOT EXISTS "Staff_organizationId_idx" ON "Staff"("organizationId");
CREATE INDEX IF NOT EXISTS "Staff_userId_idx" ON "Staff"("userId");
CREATE INDEX IF NOT EXISTS "Staff_roleId_idx" ON "Staff"("roleId");
CREATE INDEX IF NOT EXISTS "Staff_staffRole_idx" ON "Staff"("staffRole");
CREATE INDEX IF NOT EXISTS "Staff_status_idx" ON "Staff"("status");
CREATE INDEX IF NOT EXISTS "Staff_fiscalCode_idx" ON "Staff"("fiscalCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_email_key" ON "Staff"("email");

-- Aggiungi foreign keys
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
