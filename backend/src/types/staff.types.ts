// backend/src/types/staff.types.ts

export interface Staff {
  id: string;
  organizationId: string;
  userId?: string | null;
  roleId?: string | null;
  
  // Dati anagrafici
  firstName: string;
  lastName: string;
  fiscalCode?: string | null;
  birthDate?: Date | null;
  birthPlace?: string | null;
  nationality?: string;
  
  // Contatti
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  zipCode?: string | null;
  
  // Informazioni professionali
  staffRole: StaffRole;
  qualification?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiry?: Date | null;
  specialization?: string | null;
  
  // Informazioni contrattuali
  contractType?: ContractType;
  contractStart?: Date | null;
  contractEnd?: Date | null;
  salary?: number | null;
  paymentFrequency?: string | null;
  
  // Assegnazioni
  teamIds?: string[];
  primaryTeamId?: string | null;
  
  // Permessi e accessi
  permissions?: any;
  canAccessSystem?: boolean;
  canManageAthletes?: boolean;
  canManagePayments?: boolean;
  canManageDocuments?: boolean;
  canViewReports?: boolean;
  canSendNotifications?: boolean;
  
  // Documenti e certificazioni
  hasCriminalCheck?: boolean;
  criminalCheckDate?: Date | null;
  criminalCheckExpiry?: Date | null;
  hasMedicalCertificate?: boolean;
  medicalCertificateDate?: Date | null;
  medicalCertificateExpiry?: Date | null;
  
  // Informazioni emergenza
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
  
  // Stato e metadata
  status: StaffStatus;
  profilePhoto?: string | null;
  notes?: string | null;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  
  // Relazioni
  user?: any;
  role?: any;
  teams?: any[];
  primaryTeam?: any;
  documents?: any[];
  trainingSessions?: any[];
  matches?: any[];
}

export enum StaffRole {
  COACH = 'COACH',
  ASSISTANT_COACH = 'ASSISTANT_COACH',
  MEDICAL = 'MEDICAL',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  SECRETARY = 'SECRETARY',
  OTHER = 'OTHER'
}

export enum ContractType {
  EMPLOYEE = 'EMPLOYEE',
  CONTRACTOR = 'CONTRACTOR',
  VOLUNTEER = 'VOLUNTEER'
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export interface StaffFilters {
  role?: StaffRole;
  status?: StaffStatus;
  teamId?: string;
  search?: string;
  hasLicense?: boolean;
  contractType?: ContractType;
}

export interface StaffStats {
  recentTrainingSessions: number;
  recentMatches: number;
  totalActivities: number;
}

export interface StaffReport {
  summary: {
    total: number;
    active: number;
    inactive: number;
    withLicense: number;
    volunteers: number;
  };
  byRole: Record<string, number>;
  byContract: Record<string, number>;
  byStatus: Record<string, number>;
  issues: {
    expiredLicenses: number;
    expiredCertifications: number;
    upcomingExpirations: number;
  };
  generatedAt: Date;
}

export interface StaffPermissions {
  canAccessSystem: boolean;
  canManageAthletes: boolean;
  canManagePayments: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
  canSendNotifications: boolean;
  custom?: any;
}

export interface StaffCertification {
  date: Date;
  expiry: Date;
}

export interface StaffLicense {
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: Date;
}
