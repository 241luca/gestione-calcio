// backend/src/routes/athlete.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AthleteService } from '../services/athlete.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { 
  createAthleteSchema, 
  updateAthleteSchema, 
  athleteFiltersSchema,
  paginationSchema,
  idParamSchema 
} from '../validators/schemas';
import { z } from 'zod';

const router = Router();
const athleteService = new AthleteService();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/athletes
 * Recupera lista atleti con filtri e paginazione
 */
router.get('/', 
  validate({
    query: athleteFiltersSchema.merge(paginationSchema)
  }),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        sortBy = 'lastName', 
        sortOrder = 'asc',
        ...filters 
      } = req.query;

      const result = await athleteService.getAthletes(
        req.user.organizationId,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/athletes/stats
 * Recupera statistiche atleti
 */
router.get('/stats', 
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const stats = await athleteService.getAthleteStats(req.user.organizationId);
      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/athletes/export
 * Esporta atleti in formato Excel/CSV
 */
router.get('/export',
  validate({
    query: z.object({
      format: z.enum(['excel', 'csv']).default('excel'),
      teamId: z.string().uuid().optional()
    })
  }),
  authorize('athletes:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.exportAthletes(
        req.user.organizationId,
        req.query.format,
        req.query.teamId
      );
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/athletes/:id
 * Recupera dettagli singolo atleta
 */
router.get('/:id',
  validateParams(idParamSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.getAthleteById(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(athlete));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/athletes/:id/documents
 * Recupera documenti dell'atleta
 */
router.get('/:id/documents',
  validateParams(idParamSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const documents = await athleteService.getAthleteDocuments(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(documents));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/athletes/:id/payments
 * Recupera pagamenti dell'atleta
 */
router.get('/:id/payments',
  validateParams(idParamSchema),
  validate({
    query: z.object({
      status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
      year: z.string().regex(/^\d{4}$/).optional()
    })
  }),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const payments = await athleteService.getAthletePayments(
        req.params.id,
        req.user.organizationId,
        req.query
      );
      res.json(ResponseFormatter.success(payments));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/athletes
 * Crea nuovo atleta
 */
router.post('/', 
  authorize('athletes:write'),
  validateBody(createAthleteSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.createAthlete(
        req.body,
        req.user.organizationId,
        req.user.userId
      );
      
      res.status(201).json(
        ResponseFormatter.success(athlete, {
          message: 'Atleta creato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/athletes/:id
 * Aggiorna atleta
 */
router.put('/:id',
  authorize('athletes:write'),
  validate({
    params: idParamSchema,
    body: updateAthleteSchema
  }),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.updateAthlete(
        req.params.id,
        req.body,
        req.user.organizationId,
        req.user.userId
      );
      
      res.json(
        ResponseFormatter.success(athlete, {
          message: 'Atleta aggiornato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/athletes/:id
 * Elimina atleta (soft delete)
 */
router.delete('/:id',
  authorize('athletes:delete'),
  validateParams(idParamSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.deleteAthlete(
        req.params.id,
        req.user.organizationId,
        req.user.userId
      );
      
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/athletes/bulk
 * Crea più atleti
 */
router.post('/bulk',
  authorize('athletes:write'),
  validateBody(z.object({
    athletes: z.array(createAthleteSchema).min(1).max(100)
  })),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.bulkCreateAthletes(
        req.body.athletes,
        req.user.organizationId,
        req.user.userId
      );
      
      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Creati ${result.created} atleti su ${result.total}`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/athletes/import
 * Importa atleti da CSV
 */
router.post('/import',
  authorize('athletes:write'),
  // Multer middleware per file upload sarebbe qui
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // req.file conterrebbe il file CSV
      const result = await athleteService.bulkImportAthletes(
        req.file,
        req.user.organizationId,
        req.user.userId
      );
      
      res.json(
        ResponseFormatter.success(result, {
          message: `Importati ${result.imported.length} atleti su ${result.total}`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/athletes/:id/status
 * Aggiorna solo lo status dell'atleta
 */
router.patch('/:id/status',
  authorize('athletes:write'),
  validate({
    params: idParamSchema,
    body: z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'INJURED', 'SUSPENDED']),
      reason: z.string().optional()
    })
  }),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.updateAthleteStatus(
        req.params.id,
        req.body.status,
        req.user.organizationId,
        req.user.userId,
        req.body.reason
      );
      
      res.json(
        ResponseFormatter.success(athlete, {
          message: 'Status aggiornato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/athletes/:id/photo
 * Upload foto profilo atleta
 */
router.post('/:id/photo',
  authorize('athletes:write'),
  validateParams(idParamSchema),
  // Multer middleware per upload foto
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.uploadAthletePhoto(
        req.params.id,
        req.file,
        req.user.organizationId
      );
      
      res.json(
        ResponseFormatter.success(result, {
          message: 'Foto caricata con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
