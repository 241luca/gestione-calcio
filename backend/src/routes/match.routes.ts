import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/matches/upcoming
 * Recupera le prossime partite
 */
router.get('/upcoming', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const matches = await prisma.match.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date()
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: limit,
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        competition: true
      }
    });

    // Formatta i dati per il frontend
    const formattedMatches = matches.map(match => ({
      id: match.id,
      homeTeam: match.homeTeam?.name || 'Casa',
      awayTeam: match.awayTeam?.name || 'Trasferta',
      date: match.date,
      venue: match.venue?.name || 'Campo da definire',
      competition: match.competition?.name || 'Amichevole',
      isHome: match.isHome
    }));

    res.json(ResponseFormatter.success(formattedMatches));
  } catch (error) {
    console.error('Errore in GET /matches/upcoming:', error);
    next(error);
  }
});

/**
 * GET /api/v1/matches
 * Recupera tutte le partite con filtri
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    
    const filters: any = {
      organizationId
    };
    
    if (req.query.teamId) {
      filters.OR = [
        { homeTeamId: req.query.teamId },
        { awayTeamId: req.query.teamId }
      ];
    }
    
    if (req.query.from) {
      filters.date = { gte: new Date(req.query.from as string) };
    }
    
    if (req.query.to) {
      filters.date = { ...filters.date, lte: new Date(req.query.to as string) };
    }

    const matches = await prisma.match.findMany({
      where: filters,
      orderBy: {
        date: 'desc'
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        competition: true
      }
    });

    res.json(ResponseFormatter.success(matches));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/matches
 * Crea una nuova partita
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    
    const match = await prisma.match.create({
      data: {
        organizationId,
        ...req.body,
        date: new Date(req.body.date)
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        competition: true
      }
    });

    res.status(201).json(
      ResponseFormatter.success(match, {
        message: 'Partita creata con successo'
      })
    );
  } catch (error) {
    next(error);
  }
});

export default router;
