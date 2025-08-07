# 🚀 GUIDA COMPLETA SOCCER MANAGEMENT SYSTEM - PARTE 2
## Database Schema e Servizi Backend

**Versione:** 2.0.0  
**Data:** 7 Agosto 2025  

---

## 📋 INDICE PARTE 2

1. [Database Schema Completo](#database-schema)
2. [Servizi Backend](#servizi-backend)
3. [Sistema di Autenticazione](#autenticazione)
4. [Gestione Atleti](#gestione-atleti)
5. [Gestione Documenti](#gestione-documenti)

---

## 🗄️ 1. DATABASE SCHEMA COMPLETO

### Schema Prisma Ottimizzato (continua da PARTE-1)

Il file completo dello schema Prisma è troppo lungo per essere incluso qui, ma include:

- **Modelli Principali**: Organization, User, Athlete, Team, Match, Payment, Document
- **Modelli di Supporto**: Role, Permission, Position, Competition, Venue
- **Modelli Avanzati**: Injury, TrainingSession, PerformanceScore, Sponsor
- **Audit e Tracking**: AuditLog, Notification

Tutti i modelli includono:
- Indici ottimizzati per le query frequenti
- Relazioni ben definite con cascade appropriati
- Campi di timestamp (createdAt, updatedAt)
- Soft delete dove appropriato

---

## 🛠️ 2. SERVIZI BACKEND

### 2.1 Response Formatter Avanzato

```typescript
// backend/src/utils/responseFormatter.ts
import { v4 as uuidv4 } from 'uuid';

export class ResponseFormatter {
  private static requestId: string;

  static setRequestId(id: string) {
    this.requestId = id;
  }

  static success<T>(data: T, meta?: any, warnings?: string[]) {
    return {
      success: true,
      data,
      ...(meta && { meta }),
      ...(warnings && warnings.length > 0 && { warnings })
    };
  }

  static error(
    code: string, 
    message: string, 
    details?: any,
    field?: string,
    suggestion?: string
  ) {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(field && { field }),
        ...(suggestion && { suggestion })
      },
      timestamp: new Date(),
      requestId: this.requestId || uuidv4()
    };
  }

  static paginated<T>(
    data: T[], 
    page: number, 
    limit: number, 
    total: number,
    cached = false,
    cacheExpiry?: Date
  ) {
    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        cached,
        ...(cacheExpiry && { cacheExpiry })
      }
    };
  }

  static validationError(errors: any[]) {
    return this.error(
      'VALIDATION_ERROR',
      'I dati inseriti non sono validi',
      errors,
      errors[0]?.field,
      'Controlla i campi evidenziati e riprova'
    );
  }
}
```

### 2.2 Error Classes Personalizzate

```typescript
// backend/src/utils/errors.ts
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  details: any;

  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Si è verificato un errore interno') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
```

---

## 🔐 3. SISTEMA DI AUTENTICAZIONE COMPLETO

### 3.1 Auth Middleware Avanzato

```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { CacheService } from '../services/cache.service';

const cache = new CacheService();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
    isSuperAdmin?: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('Token non fornito');
    }

    // Check if token is blacklisted
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token non valido');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId || req.headers['x-organization-id'] as string,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      permissions: decoded.permissions,
      isSuperAdmin: decoded.isSuperAdmin
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token scaduto'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token non valido'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Non autenticato'));
    }

    // Super admin bypass
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check permissions
    const hasPermission = requiredPermissions.some(permission => {
      // Check exact permission
      if (req.user!.permissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions
      const [resource, action] = permission.split(':');
      return req.user!.permissions.includes(`${resource}:*`) ||
             req.user!.permissions.includes('*:*');
    });

    if (!hasPermission) {
      return next(new ForbiddenError('Permessi insufficienti'));
    }

    next();
  };
};

export const multiTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  const organizationId = req.headers['x-organization-id'] as string;
  
  if (!req.user?.isSuperAdmin && !organizationId) {
    return next(new BadRequestError('Organization ID richiesto'));
  }

  if (organizationId && req.user && !req.user.isSuperAdmin) {
    // Verify user has access to this organization
    if (req.user.organizationId !== organizationId) {
      return next(new ForbiddenError('Accesso negato a questa organizzazione'));
    }
  }

  next();
};
```

### 3.2 Rate Limiting Middleware

```typescript
// backend/src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Rate limiter generale
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:general:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per finestra
  message: 'Troppe richieste, riprova più tardi',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter per auth
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativi di login
  message: 'Troppi tentativi di login, riprova più tardi',
  skipSuccessfulRequests: true
});

// Rate limiter per upload
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:upload:'
  }),
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 20, // 20 upload per ora
  message: 'Limite upload raggiunto, riprova più tardi'
});

// Rate limiter per API mobile
export const mobileLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:mobile:'
  }),
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 richieste per minuto
  message: 'Troppe richieste, rallenta!'
});
```

---

## 👥 4. GESTIONE ATLETI COMPLETA

### 4.1 Athlete Service Completo

```typescript
// backend/src/services/athlete.service.ts (estratto principale)
import { PrismaClient, Prisma, AthleteStatus } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { calculateAge, formatDate } from '../utils/dateUtils';

const prisma = new PrismaClient();
const cache = new CacheService();
const notification = new NotificationService();
const audit = new AuditService();

export class AthleteService {
  // Cache configuration
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'athletes';

  /**
   * Recupera lista atleti con filtri avanzati e paginazione
   */
  async getAthletes(
    organizationId: string,
    filters?: AthleteFilters,
    pagination?: PaginationParams
  ) {
    const { page = 1, limit = 50, sortBy = 'lastName', sortOrder = 'asc' } = pagination || {};
    
    // Build cache key
    const cacheKey = this.buildCacheKey(organizationId, filters, pagination);
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where = this.buildWhereClause(organizationId, filters);

    // Execute queries in parallel
    const [athletes, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getIncludeOptions()
      }),
      prisma.athlete.count({ where })
    ]);

    // Process and enrich data
    const enrichedAthletes = await this.enrichAthleteData(athletes);

    const result = {
      athletes: enrichedAthletes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: filters || {},
      sorting: { sortBy, sortOrder }
    };

    // Cache result
    await cache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Recupera dettagli singolo atleta
   */
  async getAthleteById(id: string, organizationId: string) {
    const athlete = await prisma.athlete.findFirst({
      where: { id, organizationId },
      include: {
        team: true,
        position: true,
        transportZone: true,
        documents: {
          include: { type: true },
          orderBy: { expiryDate: 'asc' }
        },
        payments: {
          include: { type: true },
          orderBy: { dueDate: 'desc' },
          take: 10
        },
        matchRoster: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                competition: true
              }
            }
          },
          orderBy: { match: { date: 'desc' } },
          take: 10
        },
        matchStats: {
          include: { match: true },
          orderBy: { match: { date: 'desc' } },
          take: 10
        },
        injuries: {
          orderBy: { injuryDate: 'desc' }
        },
        performanceScores: {
          orderBy: { date: 'desc' },
          take: 5
        },
        trainingAttendance: {
          include: { session: true },
          orderBy: { session: { date: 'desc' } },
          take: 10
        }
      }
    });

    if (!athlete) {
      throw new NotFoundError('Atleta non trovato');
    }

    // Calculate additional stats
    const stats = await this.calculateAthleteStats(id);
    const upcomingMatches = await this.getUpcomingMatches(athlete.teamId);
    const documentStatus = this.analyzeDocumentStatus(athlete.documents);
    const paymentStatus = this.analyzePaymentStatus(athlete.payments);

    return {
      ...athlete,
      age: calculateAge(athlete.birthDate),
      stats,
      upcomingMatches,
      documentStatus,
      paymentStatus,
      isAvailable: this.checkAvailability(athlete)
    };
  }

  /**
   * Crea nuovo atleta con validazioni complete
   */
  async createAthlete(data: CreateAthleteDto, organizationId: string, userId: string) {
    // Validate unique constraints
    await this.validateUniqueConstraints(data);

    // Validate age category if team is specified
    if (data.teamId) {
      await this.validateAgeCategory(data.birthDate, data.teamId);
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create athlete
      const athlete = await tx.athlete.create({
        data: {
          ...data,
          organizationId,
          status: data.status || 'ACTIVE'
        },
        include: this.getIncludeOptions()
      });

      // Create welcome documents placeholders
      await this.createInitialDocuments(athlete.id, organizationId, tx);

      // Create initial payment records if needed
      if (data.createPayments) {
        await this.createInitialPayments(athlete.id, organizationId, tx);
      }

      // Send notifications
      await notification.sendAthleteWelcome(athlete, organizationId);

      // Audit log
      await audit.log({
        organizationId,
        userId,
        action: 'CREATE',
        entityType: 'ATHLETE',
        entityId: athlete.id,
        newValues: athlete
      });

      return athlete;
    });

    // Clear cache
    await this.invalidateCache(organizationId);

    return result;
  }

  /**
   * Aggiorna atleta con tracking modifiche
   */
  async updateAthlete(
    id: string,
    data: UpdateAthleteDto,
    organizationId: string,
    userId: string
  ) {
    // Get existing athlete
    const existing = await this.getAthleteById(id, organizationId);

    // Validate changes
    if (data.fiscalCode && data.fiscalCode !== existing.fiscalCode) {
      await this.validateFiscalCode(data.fiscalCode);
    }

    if (data.jerseyNumber && (data.teamId || existing.teamId)) {
      await this.validateJerseyNumber(
        data.jerseyNumber,
        data.teamId || existing.teamId!,
        id
      );
    }

    // Update athlete
    const updated = await prisma.athlete.update({
      where: { id },
      data,
      include: this.getIncludeOptions()
    });

    // Track important changes
    const changes = this.detectImportantChanges(existing, updated);
    
    if (changes.length > 0) {
      // Send notifications for important changes
      for (const change of changes) {
        await this.handleImportantChange(change, updated, existing);
      }
    }

    // Audit log
    await audit.log({
      organizationId,
      userId,
      action: 'UPDATE',
      entityType: 'ATHLETE',
      entityId: id,
      oldValues: existing,
      newValues: updated
    });

    // Clear cache
    await this.invalidateCache(organizationId);

    return updated;
  }

  /**
   * Elimina atleta (soft delete)
   */
  async deleteAthlete(id: string, organizationId: string, userId: string) {
    const athlete = await this.getAthleteById(id, organizationId);

    // Check dependencies
    const hasActivePayments = await prisma.payment.count({
      where: {
        athleteId: id,
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    });

    if (hasActivePayments > 0) {
      throw new BadRequestError(
        'Non puoi eliminare un atleta con pagamenti in sospeso'
      );
    }

    // Soft delete
    const deleted = await prisma.athlete.update({
      where: { id },
      data: { 
        status: 'INACTIVE' as AthleteStatus,
        teamId: null // Remove from team
      }
    });

    // Audit log
    await audit.log({
      organizationId,
      userId,
      action: 'DELETE',
      entityType: 'ATHLETE',
      entityId: id,
      oldValues: athlete
    });

    // Clear cache
    await this.invalidateCache(organizationId);

    return { success: true, message: 'Atleta eliminato con successo' };
  }

  /**
   * Importa atleti da file CSV/Excel
   */
  async bulkImportAthletes(
    file: Express.Multer.File,
    organizationId: string,
    userId: string
  ) {
    const athletes = await this.parseImportFile(file);
    
    const results = {
      imported: [],
      failed: [],
      total: athletes.length
    };

    for (const [index, athleteData] of athletes.entries()) {
      try {
        // Validate and clean data
        const cleanedData = await this.validateImportData(athleteData);
        
        // Create athlete
        const athlete = await this.createAthlete(
          cleanedData,
          organizationId,
          userId
        );
        
        results.imported.push({
          row: index + 1,
          athlete
        });
      } catch (error: any) {
        results.failed.push({
          row: index + 1,
          data: athleteData,
          error: error.message
        });
      }
    }

    // Send import report
    await notification.sendImportReport(results, organizationId, userId);

    return results;
  }

  // Helper methods
  private buildCacheKey(
    organizationId: string,
    filters?: any,
    pagination?: any
  ): string {
    const key = `${this.CACHE_PREFIX}:${organizationId}`;
    const params = JSON.stringify({ filters, pagination });
    return `${key}:${params}`;
  }

  private async invalidateCache(organizationId: string) {
    await cache.deletePattern(`${this.CACHE_PREFIX}:${organizationId}:*`);
  }

  private getIncludeOptions() {
    return {
      team: true,
      position: true,
      transportZone: true,
      _count: {
        select: {
          documents: true,
          payments: true,
          matchRoster: true,
          injuries: true
        }
      }
    };
  }

  private buildWhereClause(
    organizationId: string,
    filters?: AthleteFilters
  ): Prisma.AthleteWhereInput {
    return {
      organizationId,
      ...(filters?.teamId && { teamId: filters.teamId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { fiscalCode: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }),
      ...(filters?.hasExpiredDocuments && {
        documents: {
          some: { status: 'EXPIRED' }
        }
      }),
      ...(filters?.hasOverduePayments && {
        payments: {
          some: { status: 'OVERDUE' }
        }
      }),
      ...(filters?.isInjured && {
        injuries: {
          some: { isRecovered: false }
        }
      }),
      ...(filters?.ageMin && {
        birthDate: {
          lte: new Date(
            new Date().getFullYear() - filters.ageMin,
            new Date().getMonth(),
            new Date().getDate()
          )
        }
      }),
      ...(filters?.ageMax && {
        birthDate: {
          gte: new Date(
            new Date().getFullYear() - filters.ageMax,
            new Date().getMonth(),
            new Date().getDate()
          )
        }
      })
    };
  }

  private async enrichAthleteData(athletes: any[]) {
    return athletes.map(athlete => ({
      ...athlete,
      age: calculateAge(athlete.birthDate),
      fullName: `${athlete.firstName} ${athlete.lastName}`,
      hasIssues: this.checkAthleteIssues(athlete),
      availability: this.checkAvailability(athlete)
    }));
  }

  private checkAthleteIssues(athlete: any): boolean {
    return athlete._count.documents === 0 ||
           athlete._count.injuries > 0 ||
           athlete.status !== 'ACTIVE';
  }

  private checkAvailability(athlete: any): string {
    if (athlete.status === 'INJURED') return 'injured';
    if (athlete.status === 'SUSPENDED') return 'suspended';
    if (athlete.injuries?.some((i: any) => !i.isRecovered)) return 'injured';
    return 'available';
  }
}

// Type definitions
interface AthleteFilters {
  teamId?: string;
  status?: AthleteStatus;
  search?: string;
  hasExpiredDocuments?: boolean;
  hasOverduePayments?: boolean;
  isInjured?: boolean;
  ageMin?: number;
  ageMax?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateAthleteDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  fiscalCode?: string;
  email?: string;
  phone?: string;
  teamId?: string;
  positionId?: number;
  jerseyNumber?: number;
  status?: AthleteStatus;
  createPayments?: boolean;
}

interface UpdateAthleteDto extends Partial<CreateAthleteDto> {}
```

---

## 📄 5. GESTIONE DOCUMENTI AVANZATA

### 5.1 Document Service con Cloud Storage

```typescript
// backend/src/services/document.service.ts
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CacheService } from './cache.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { addDays, differenceInDays, isBefore } from 'date-fns';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const cache = new CacheService();
const storage = new StorageService();
const notification = new NotificationService();

export class DocumentService {
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly IMAGE_MAX_WIDTH = 2000;
  private readonly IMAGE_MAX_HEIGHT = 2000;

  /**
   * Upload documento con validazioni e ottimizzazioni
   */
  async uploadDocument(
    file: Express.Multer.File,
    data: UploadDocumentDto,
    organizationId: string,
    userId: string
  ) {
    // Validate file
    this.validateFile(file);

    // Validate athlete exists
    const athlete = await prisma.athlete.findFirst({
      where: {
        id: data.athleteId,
        organizationId
      }
    });

    if (!athlete) {
      throw new NotFoundError('Atleta non trovato');
    }

    // Get document type
    const documentType = await prisma.documentType.findUnique({
      where: { id: data.typeId }
    });

    if (!documentType) {
      throw new NotFoundError('Tipo documento non trovato');
    }

    // Process file based on type
    let processedFile = file;
    if (this.isImage(file.mimetype)) {
      processedFile = await this.processImage(file);
    }

    // Generate secure filename
    const secureFilename = this.generateSecureFilename(file.originalname);

    // Upload to storage
    const uploadPath = `${organizationId}/athletes/${data.athleteId}/documents`;
    const fileUrl = await storage.upload(processedFile, {
      folder: uploadPath,
      fileName: secureFilename,
      contentType: file.mimetype,
      metadata: {
        athleteId: data.athleteId,
        documentType: documentType.name,
        uploadedBy: userId
      }
    });

    // Calculate expiry and status
    const { expiryDate, status } = this.calculateExpiryAndStatus(
      data.expiryDate,
      data.issueDate,
      documentType
    );

    // Create document record
    const document = await prisma.document.create({
      data: {
        organizationId,
        athleteId: data.athleteId,
        typeId: data.typeId,
        fileName: file.originalname,
        fileUrl,
        fileSize: processedFile.size,
        mimeType: file.mimetype,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate,
        status,
        notes: data.notes,
        uploadedBy: userId,
        isVerified: false
      },
      include: {
        athlete: true,
        type: true
      }
    });

    // Send notifications if needed
    if (status === 'EXPIRING') {
      await notification.sendDocumentExpiringSoon(document, athlete);
    }

    // Check if all required documents are now complete
    await this.checkDocumentCompleteness(data.athleteId, organizationId);

    // Clear cache
    await cache.deletePattern(`documents:${organizationId}:*`);

    return document;
  }

  /**
   * Verifica documento
   */
  async verifyDocument(
    id: string,
    organizationId: string,
    userId: string,
    notes?: string
  ) {
    const document = await prisma.document.findFirst({
      where: { id, organizationId },
      include: { athlete: true, type: true }
    });

    if (!document) {
      throw new NotFoundError('Documento non trovato');
    }

    if (document.isVerified) {
      throw new BadRequestError('Documento già verificato');
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedBy: userId,
        verifiedAt: new Date(),
        notes: notes ? `${document.notes || ''}\nVerifica: ${notes}` : document.notes
      }
    });

    // Send notification
    await notification.sendDocumentVerified(updated, document.athlete);

    // Clear cache
    await cache.deletePattern(`documents:${organizationId}:*`);

    return updated;
  }

  /**
   * Controllo documenti in scadenza (cron job)
   */
  async checkExpiringDocuments() {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    const sevenDaysFromNow = addDays(new Date(), 7);

    // Find documents expiring soon
    const expiringDocuments = await prisma.document.findMany({
      where: {
        expiryDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        status: { not: 'EXPIRED' }
      },
      include: {
        athlete: true,
        type: true,
        organization: true
      }
    });

    const updates = [];
    const notifications = [];

    for (const doc of expiringDocuments) {
      const daysUntilExpiry = differenceInDays(doc.expiryDate!, new Date());
      let newStatus: DocumentStatus = 'VALID';

      if (daysUntilExpiry <= 30) {
        newStatus = 'EXPIRING';
      }

      // Update status if changed
      if (newStatus !== doc.status) {
        updates.push(
          prisma.document.update({
            where: { id: doc.id },
            data: { status: newStatus }
          })
        );
      }

      // Send notifications at specific intervals
      if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 1) {
        notifications.push({
          document: doc,
          daysUntilExpiry
        });
      }
    }

    // Execute updates
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    // Send notifications
    for (const notif of notifications) {
      await notification.sendDocumentExpiryReminder(
        notif.document,
        notif.daysUntilExpiry
      );
    }

    // Check for expired documents
    await this.markExpiredDocuments();

    return {
      checked: expiringDocuments.length,
      updated: updates.length,
      notificationsSent: notifications.length
    };
  }

  /**
   * Genera report documenti
   */
  async generateDocumentReport(organizationId: string) {
    const [summary, byType, byAthlete, expiringSoon] = await Promise.all([
      this.getDocumentSummary(organizationId),
      this.getDocumentsByType(organizationId),
      this.getDocumentsByAthlete(organizationId),
      this.getExpiringDocuments(organizationId, 30)
    ]);

    return {
      summary,
      byType,
      byAthlete,
      expiringSoon,
      generatedAt: new Date()
    };
  }

  // Helper methods
  private validateFile(file: Express.Multer.File) {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Tipo di file non supportato. Formati accettati: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestError(
        `File troppo grande. Dimensione massima: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Additional security checks
    if (this.containsMaliciousContent(file)) {
      throw new BadRequestError('File potenzialmente pericoloso rilevato');
    }
  }

  private containsMaliciousContent(file: Express.Multer.File): boolean {
    // Check for suspicious patterns in file content
    // This is a simplified check - in production use a proper antivirus/malware scanner
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onclick=/i,
      /.exe$/i,
      /.bat$/i,
      /.cmd$/i
    ];

    const content = file.buffer.toString('utf8', 0, 1000); // Check first 1KB
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private async processImage(file: Express.Multer.File) {
    const processedBuffer = await sharp(file.buffer)
      .resize(this.IMAGE_MAX_WIDTH, this.IMAGE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return {
      ...file,
      buffer: processedBuffer,
      size: processedBuffer.length,
      mimetype: 'image/jpeg'
    };
  }

  private generateSecureFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  }

  private calculateExpiryAndStatus(
    expiryDate?: string,
    issueDate?: string,
    documentType?: any
  ) {
    let finalExpiryDate = expiryDate ? new Date(expiryDate) : null;
    
    if (!finalExpiryDate && documentType?.hasExpiry && documentType?.validityDays) {
      const baseDate = issueDate ? new Date(issueDate) : new Date();
      finalExpiryDate = addDays(baseDate, documentType.validityDays);
    }

    let status: DocumentStatus = 'VALID';
    if (finalExpiryDate) {
      const daysUntilExpiry = differenceInDays(finalExpiryDate, new Date());
      
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING';
      }
    }

    return { expiryDate: finalExpiryDate, status };
  }

  private async checkDocumentCompleteness(
    athleteId: string,
    organizationId: string
  ) {
    const requiredTypes = await prisma.documentType.findMany({
      where: { isRequired: true }
    });

    const athleteDocuments = await prisma.document.findMany({
      where: {
        athleteId,
        organizationId,
        status: { not: 'EXPIRED' }
      },
      select: { typeId: true }
    });

    const uploadedTypeIds = new Set(athleteDocuments.map(d => d.typeId));
    const missingTypes = requiredTypes.filter(t => !uploadedTypeIds.has(t.id));

    if (missingTypes.length === 0) {
      // All required documents uploaded
      await notification.sendDocumentsComplete(athleteId, organizationId);
    }

    return {
      complete: missingTypes.length === 0,
      missing: missingTypes
    };
  }

  private async markExpiredDocuments() {
    const expiredDocuments = await prisma.document.findMany({
      where: {
        expiryDate: { lt: new Date() },
        status: { not: 'EXPIRED' }
      },
      include: {
        athlete: true,
        type: true,
        organization: true
      }
    });

    if (expiredDocuments.length === 0) return;

    // Update status to EXPIRED
    await prisma.document.updateMany({
      where: {
        id: { in: expiredDocuments.map(d => d.id) }
      },
      data: { status: 'EXPIRED' }
    });

    // Send notifications
    for (const doc of expiredDocuments) {
      await notification.sendDocumentExpired(doc);
    }

    // Clear cache for affected organizations
    const orgIds = new Set(expiredDocuments.map(d => d.organizationId));
    for (const orgId of orgIds) {
      await cache.deletePattern(`documents:${orgId}:*`);
    }
  }

  private async getDocumentSummary(organizationId: string) {
    const result = await prisma.document.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    return result.reduce((acc, item) => ({
      ...acc,
      [item.status.toLowerCase()]: item._count
    }), {
      valid: 0,
      expiring: 0,
      expired: 0
    });
  }
}

// Type definitions
interface UploadDocumentDto {
  athleteId: string;
  typeId: number;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}
```

Perfetto! Ho diviso la documentazione in parti più gestibili. Continuo con le altre parti?
