// backend/src/validators/schemas.ts
import { z } from 'zod';

// ===============================
// COMMON SCHEMAS
// ===============================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID non valido')
});

// ===============================
// ATHLETE SCHEMAS
// ===============================

export const createAthleteSchema = z.object({
  firstName: z.string().min(2, 'Nome troppo corto').max(50),
  lastName: z.string().min(2, 'Cognome troppo corto').max(50),
  birthDate: z.string().datetime(),
  birthPlace: z.string().optional(),
  nationality: z.string().default('IT'),
  fiscalCode: z.string()
    .regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/, 'Codice fiscale non valido')
    .optional(),
  email: z.string().email('Email non valida').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email().optional(),
  medicalCertificateDate: z.string().datetime().optional(),
  medicalCertificateExpiry: z.string().datetime().optional(),
  teamId: z.string().uuid().optional(),
  positionId: z.number().optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INJURED', 'SUSPENDED']).default('ACTIVE'),
  notes: z.string().optional(),
  transportZoneId: z.string().optional(),
  needsTransport: z.boolean().default(false),
  profilePhoto: z.string().url().optional()
});

export const updateAthleteSchema = createAthleteSchema.partial();

export const athleteFiltersSchema = z.object({
  teamId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INJURED', 'SUSPENDED']).optional(),
  search: z.string().optional(),
  hasExpiredDocuments: z.string().transform(val => val === 'true').optional(),
  hasOverduePayments: z.string().transform(val => val === 'true').optional(),
  isInjured: z.string().transform(val => val === 'true').optional(),
  ageMin: z.string().regex(/^\d+$/).transform(Number).optional(),
  ageMax: z.string().regex(/^\d+$/).transform(Number).optional()
});

// ===============================
// DOCUMENT SCHEMAS
// ===============================

export const createDocumentSchema = z.object({
  athleteId: z.string().uuid('ID atleta non valido'),
  typeId: z.number().positive('Tipo documento non valido'),
  fileName: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const updateDocumentSchema = z.object({
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  isVerified: z.boolean().optional()
});

export const documentFiltersSchema = z.object({
  athleteId: z.string().uuid().optional(),
  typeId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['VALID', 'EXPIRING', 'EXPIRED']).optional(),
  isVerified: z.string().transform(val => val === 'true').optional()
});

// ===============================
// PAYMENT SCHEMAS
// ===============================

export const createPaymentSchema = z.object({
  athleteId: z.string().uuid('ID atleta non valido'),
  typeId: z.number().positive('Tipo pagamento non valido'),
  amount: z.number().positive('Importo deve essere positivo'),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING')
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Importo deve essere positivo'),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'OTHER']),
  transactionId: z.string().optional(),
  notes: z.string().optional()
});

export const paymentFiltersSchema = z.object({
  athleteId: z.string().uuid().optional(),
  typeId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

// ===============================
// TEAM SCHEMAS
// ===============================

export const createTeamSchema = z.object({
  name: z.string().min(3, 'Nome troppo corto').max(50),
  category: z.string().min(2).max(20),
  season: z.string().regex(/^\d{4}\/\d{4}$/),
  coachId: z.string().uuid().optional(),
  assistantCoachId: z.string().uuid().optional(),
  maxPlayers: z.number().min(10).max(30).default(20),
  trainingDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
  trainingTime: z.string().regex(/^\d{2}:\d{2}$/),
  fieldId: z.string().uuid().optional(),
  notes: z.string().optional()
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamFiltersSchema = z.object({
  category: z.string().optional(),
  season: z.string().optional(),
  coachId: z.string().uuid().optional()
});

// ===============================
// MATCH SCHEMAS
// ===============================

export const createMatchSchema = z.object({
  date: z.string().datetime(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  competitionId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  isHome: z.boolean(),
  meetingTime: z.string().regex(/^\d{2}:\d{2}$/),
  meetingPlace: z.string().optional(),
  notes: z.string().optional()
});

export const updateMatchSchema = createMatchSchema.partial();

export const matchFiltersSchema = z.object({
  teamId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  isHome: z.string().transform(val => val === 'true').optional()
});

// ===============================
// TRANSPORT SCHEMAS
// ===============================

export const createTransportSchema = z.object({
  matchId: z.string().uuid(),
  departureTime: z.string().datetime(),
  departurePlace: z.string(),
  vehicleType: z.enum(['BUS', 'MINIBUS', 'CAR', 'OTHER']),
  capacity: z.number().positive(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  cost: z.number().positive().optional(),
  notes: z.string().optional()
});

export const updateTransportSchema = createTransportSchema.partial();

export const transportFiltersSchema = z.object({
  matchId: z.string().uuid().optional(),
  vehicleType: z.enum(['BUS', 'MINIBUS', 'CAR', 'OTHER']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});
