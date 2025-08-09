// backend/src/routes/training.routes.ts
import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { TrainingService } from '../services/training.service';
import { z } from 'zod';

const router = Router();
const trainingService = new TrainingService();

// Applica autenticazione a tutte le route
router.use(authenticate);

// Schema di validazione
const createTrainingSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string(),
  time: z.string().optional(),
  duration: z.number().min(30).max(180).optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

const updateTrainingSchema = createTrainingSchema.partial();

/**
 * GET /api/v1/training-sessions
 * Recupera tutte le sessioni di allenamento
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    const filters = {
      teamId: req.query.teamId as string,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
      status: req.query.status as string
    };

    const trainingSessions = await trainingService.getTrainingSessions(
      organizationId,
      filters
    );

    res.json(ResponseFormatter.success(trainingSessions));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/training-sessions/today
 * Recupera le sessioni di allenamento di oggi
 */
router.get('/today', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    const trainingSessions = await trainingService.getTodayTrainingSessions(organizationId);
    
    res.json(ResponseFormatter.success(trainingSessions, {
      message: trainingSessions.length > 0 
        ? `${trainingSessions.length} allenamenti programmati per oggi`
        : 'Nessun allenamento programmato per oggi'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/training-sessions/:id
 * Recupera una singola sessione di allenamento
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    const training = await trainingService.getTrainingSessionById(
      req.params.id,
      organizationId
    );

    res.json(ResponseFormatter.success(training));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/training-sessions
 * Crea una nuova sessione di allenamento
 */
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    
    // Valida i dati
    const validatedData = createTrainingSchema.parse(req.body);
    
    const training = await trainingService.createTrainingSession({
      organizationId,
      ...validatedData,
      date: new Date(validatedData.date)
    });

    res.status(201).json(ResponseFormatter.success(training, {
      message: 'Sessione di allenamento creata con successo'
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.validationError(error.errors));
    }
    next(error);
  }
});

/**
 * PUT /api/v1/training-sessions/:id
 * Aggiorna una sessione di allenamento
 */
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    
    // Valida i dati
    const validatedData = updateTrainingSchema.parse(req.body);
    
    const training = await trainingService.updateTrainingSession(
      req.params.id,
      organizationId,
      {
        ...validatedData,
        date: validatedData.date ? new Date(validatedData.date) : undefined
      }
    );

    res.json(ResponseFormatter.success(training, {
      message: 'Sessione di allenamento aggiornata con successo'
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.validationError(error.errors));
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/training-sessions/:id
 * Elimina una sessione di allenamento
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    
    const result = await trainingService.deleteTrainingSession(
      req.params.id,
      organizationId
    );

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/training-sessions/:id/attendance
 * Registra le presenze per una sessione di allenamento
 */
router.post('/:id/attendance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    const { attendance } = req.body;

    if (!Array.isArray(attendance)) {
      return res.status(400).json(
        ResponseFormatter.error('VALIDATION_ERROR', 'Formato presenze non valido')
      );
    }

    const training = await trainingService.recordAttendance(
      req.params.id,
      organizationId,
      attendance
    );

    res.json(ResponseFormatter.success(training, {
      message: 'Presenze registrate con successo'
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
