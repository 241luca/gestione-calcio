// backend/src/routes/athlete.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AthleteService } from '../services/athlete.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();
const athleteService = new AthleteService();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/athletes
 * Recupera lista atleti con filtri e paginazione
 */
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const filters = {
      teamId: req.query.teamId,
      status: req.query.status,
      search: req.query.search
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      sortBy: req.query.sortBy as string || 'lastName',
      sortOrder: req.query.sortOrder as string || 'asc'
    };

    const result = await athleteService.getAthletes(
      req.user.organizationId,
      filters,
      pagination
    );

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/athletes/stats
 * Recupera statistiche atleti
 */
router.get('/stats', async (req: any, res: Response, next: NextFunction) => {
  try {
    const stats = await athleteService.getAthleteStats(req.user.organizationId);
    res.json(ResponseFormatter.success(stats));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/athletes/:id
 * Recupera dettagli singolo atleta
 */
router.get('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const athlete = await athleteService.getAthleteById(
      req.params.id,
      req.user.organizationId
    );
    res.json(ResponseFormatter.success(athlete));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/athletes
 * Crea nuovo atleta
 */
router.post('/', 
  authorize('athletes:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.createAthlete(
        req.body,
        req.user.organizationId
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
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const athlete = await athleteService.updateAthlete(
        req.params.id,
        req.body,
        req.user.organizationId
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
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.deleteAthlete(
        req.params.id,
        req.user.organizationId
      );
      
      res.json(ResponseFormatter.success(result));
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
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await athleteService.bulkImportAthletes(
        req.body.athletes,
        req.user.organizationId
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

export default router;
