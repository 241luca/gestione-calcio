// backend/src/routes/training.routes.ts
import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/training-sessions/today
 * Recupera le sessioni di allenamento di oggi
 */
router.get('/today', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Per ora restituiamo un array vuoto
    // TODO: Implementare la logica per recuperare le sessioni di allenamento dal database
    const trainingSessions: any[] = [];
    
    res.json(ResponseFormatter.success(trainingSessions, {
      message: 'Nessuna sessione di allenamento programmata per oggi'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/training-sessions
 * Recupera tutte le sessioni di allenamento
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Implementare la logica per recuperare tutte le sessioni
    const trainingSessions: any[] = [];
    
    res.json(ResponseFormatter.success(trainingSessions));
  } catch (error) {
    next(error);
  }
});

export default router;
