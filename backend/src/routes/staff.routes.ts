// backend/src/routes/staff.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import staffService, { StaffRole, ContractType, StaffStatus } from '../services/staff.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError, ValidationError } from '../utils/errors';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configurazione upload foto profilo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/staff/photos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse'));
    }
  }
});

// Schema validazione per creazione staff
const createStaffSchema = z.object({
  firstName: z.string().min(2, 'Nome troppo corto'),
  lastName: z.string().min(2, 'Cognome troppo corto'),
  fiscalCode: z.string().optional(),
  birthDate: z.string().optional(),
  email: z.string().email('Email non valida').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  staffRole: z.nativeEnum(StaffRole),
  qualification: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseType: z.string().optional(),
  licenseExpiry: z.string().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  salary: z.number().optional(),
  teamIds: z.array(z.string()).optional(),
  primaryTeamId: z.string().optional(),
  canAccessSystem: z.boolean().optional(),
  canManageAthletes: z.boolean().optional(),
  canManagePayments: z.boolean().optional(),
  canManageDocuments: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canSendNotifications: z.boolean().optional(),
  createUser: z.boolean().optional(),
  userPassword: z.string().optional()
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/v1/staff
 * Recupera lista staff con filtri e paginazione
 */
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    
    const filters = {
      role: req.query.role as StaffRole,
      status: req.query.status as StaffStatus,
      teamId: req.query.teamId as string,
      search: req.query.search as string,
      hasLicense: req.query.hasLicense ? req.query.hasLicense === 'true' : undefined,
      contractType: req.query.contractType as ContractType
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await staffService.getStaffMembers(
      organizationId,
      filters,
      page,
      limit
    );

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/stats
 * Ottieni statistiche staff
 */
router.get('/stats', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    
    const report = await staffService.getStaffReport(organizationId);
    
    res.json(ResponseFormatter.success(report));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/by-role/:role
 * Recupera staff per ruolo
 */
router.get('/by-role/:role', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const role = req.params.role as StaffRole;

    if (!Object.values(StaffRole).includes(role)) {
      throw new BadRequestError('Ruolo non valido');
    }

    const staff = await staffService.getStaffByRole(role, organizationId);
    
    res.json(ResponseFormatter.success(staff));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/by-team/:teamId
 * Recupera staff per team
 */
router.get('/by-team/:teamId', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { teamId } = req.params;

    const staff = await staffService.getStaffByTeam(teamId, organizationId);
    
    res.json(ResponseFormatter.success(staff));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/:id
 * Recupera singolo membro staff
 */
router.get('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    const staff = await staffService.getStaffById(id, organizationId);
    
    res.json(ResponseFormatter.success(staff));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/staff
 * Crea nuovo membro staff
 */
router.post('/', authorize('staff:create'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    
    // Valida dati
    const validation = createStaffSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Dati non validi', validation.error.errors);
    }

    // Converti le date da string a Date
    const staffData = {
      ...validation.data,
      birthDate: validation.data.birthDate ? new Date(validation.data.birthDate) : undefined,
      licenseExpiry: validation.data.licenseExpiry ? new Date(validation.data.licenseExpiry) : undefined,
      contractStart: validation.data.contractStart ? new Date(validation.data.contractStart) : undefined,
      contractEnd: validation.data.contractEnd ? new Date(validation.data.contractEnd) : undefined
    };
    
    const staff = await staffService.createStaff(staffData, organizationId);
    
    res.status(201).json(ResponseFormatter.success(staff));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/staff/:id
 * Aggiorna membro staff
 */
router.put('/:id', authorize('staff:update'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    const updated = await staffService.updateStaff(id, req.body, organizationId);
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/staff/:id
 * Elimina membro staff (soft delete)
 */
router.delete('/:id', authorize('staff:delete'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    const result = await staffService.deleteStaff(id, organizationId);
    
    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/staff/:id/photo
 * Upload foto profilo
 */
router.post('/:id/photo', 
  authorize('staff:update'),
  upload.single('photo'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { id } = req.params;

      if (!req.file) {
        throw new BadRequestError('Nessun file caricato');
      }

      const photoUrl = `/uploads/staff/photos/${req.file.filename}`;
      
      const updated = await staffService.updateStaff(
        id,
        { profilePhoto: photoUrl },
        organizationId
      );
      
      res.json(ResponseFormatter.success({
        photoUrl,
        staff: updated
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/staff/:id/assign-team
 * Assegna staff a team
 */
router.post('/:id/assign-team', authorize('staff:update'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { teamId, isPrimary } = req.body;

    if (!teamId) {
      throw new BadRequestError('Team ID richiesto');
    }

    const updated = await staffService.assignToTeam(
      id,
      teamId,
      organizationId,
      isPrimary
    );
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/staff/:id/remove-team
 * Rimuovi staff da team
 */
router.post('/:id/remove-team', authorize('staff:update'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      throw new BadRequestError('Team ID richiesto');
    }

    const updated = await staffService.removeFromTeam(
      id,
      teamId,
      organizationId
    );
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/staff/:id/permissions
 * Aggiorna permessi staff
 */
router.put('/:id/permissions', authorize('staff:permissions'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    const updated = await staffService.updatePermissions(
      id,
      req.body,
      organizationId
    );
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/staff/:id/license
 * Rinnova patentino/licenza
 */
router.put('/:id/license', authorize('staff:update'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { licenseNumber, licenseType, licenseExpiry } = req.body;

    if (!licenseNumber || !licenseType || !licenseExpiry) {
      throw new BadRequestError('Dati licenza incompleti');
    }

    const updated = await staffService.renewLicense(
      id,
      {
        licenseNumber,
        licenseType,
        licenseExpiry: new Date(licenseExpiry)
      },
      organizationId
    );
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/staff/:id/certifications
 * Aggiorna certificazioni
 */
router.put('/:id/certifications', authorize('staff:update'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { criminalCheck, medicalCertificate } = req.body;

    const certifications: any = {};

    if (criminalCheck) {
      certifications.criminalCheck = {
        date: new Date(criminalCheck.date),
        expiry: new Date(criminalCheck.expiry)
      };
    }

    if (medicalCertificate) {
      certifications.medicalCertificate = {
        date: new Date(medicalCertificate.date),
        expiry: new Date(medicalCertificate.expiry)
      };
    }

    const updated = await staffService.updateCertifications(
      id,
      certifications,
      organizationId
    );
    
    res.json(ResponseFormatter.success(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/staff/check-expiring
 * Controlla documenti/certificazioni in scadenza
 */
router.post('/check-expiring', async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { days = 30 } = req.body;

    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + days);

    // Query per trovare staff con documenti in scadenza
    const expiring = await staffService.getStaffMembers(
      organizationId,
      { status: StaffStatus.ACTIVE },
      1,
      1000
    );

    const expiringStaff = expiring.staffMembers.filter((member: any) => {
      // Il servizio arricchisce i dati e potrebbe modificare i nomi dei campi
      // Usiamo i flag già calcolati dal servizio
      return member.isLicenseExpired || member.isCriminalCheckExpired || member.isMedicalExpired;
    });

    res.json(ResponseFormatter.success({
      count: expiringStaff.length,
      staff: expiringStaff,
      checkDate
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/export
 * Export staff in Excel/CSV
 */
router.get('/export', authorize('staff:export'), async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const format = req.query.format || 'csv';

    const staff = await staffService.getStaffMembers(
      organizationId,
      {},
      1,
      10000
    );

    // Prepara dati per export
    const exportData = staff.staffMembers.map((member: any) => ({
      Nome: member.firstName,
      Cognome: member.lastName,
      Ruolo: member.role || member.staffRole || '',
      Email: member.email || '',
      Telefono: member.phone || '',
      Cellulare: member.cellphone || '',
      'Tipo Contratto': member.contract || '',
      'Patentino': member.licenseNumber || '',
      'Scadenza Patentino': member.licenseExpiry ? new Date(member.licenseExpiry).toLocaleDateString('it-IT') : '',
      Stato: member.state || 'ACTIVE',
      Team: ''
    }));

    if (format === 'csv') {
      // Genera CSV
      const csv = convertToCSV(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=staff.csv');
      res.send(csv);
    } else {
      // Per Excel useremo una libreria come ExcelJS
      res.json(ResponseFormatter.success({
        format: 'json',
        data: exportData
      }));
    }
  } catch (error) {
    next(error);
  }
});

// Helper function per convertire a CSV
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

export default router;
