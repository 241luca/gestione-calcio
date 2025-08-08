// backend/src/routes/competitions.routes.ts
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/competitions
 * Lista tutte le competizioni
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { page = 1, limit = 20, search } = req.query;

    const where: any = {
      organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take: limit as number,
        orderBy: { startDate: 'desc' },
        include: {
          _count: {
            select: {
              matches: true
            }
          }
        }
      }),
      prisma.competition.count({ where })
    ]);

    res.json(ResponseFormatter.paginated(
      competitions,
      page as number,
      limit as number,
      total
    ));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/competitions/:id
 * Dettaglio singola competizione
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const competition = await prisma.competition.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            venue: true
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!competition) {
      throw new NotFoundError('Competizione non trovata');
    }

    res.json(ResponseFormatter.success(competition));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/competitions
 * Crea nuova competizione
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { name, type, category, startDate, endDate, description } = req.body;

    // Validazione base
    if (!name || !type || !category) {
      throw new BadRequestError('Nome, tipo e categoria sono obbligatori');
    }

    const competition = await prisma.competition.create({
      data: {
        organizationId,
        name,
        type,
        category,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        description
      }
    });

    res.status(201).json(ResponseFormatter.success(competition, {
      message: 'Competizione creata con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/competitions/:id
 * Aggiorna competizione
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const updateData = req.body;

    // Verifica esistenza
    const existing = await prisma.competition.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Competizione non trovata');
    }

    // Prepara dati aggiornamento
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const competition = await prisma.competition.update({
      where: { id },
      data: updateData
    });

    res.json(ResponseFormatter.success(competition, {
      message: 'Competizione aggiornata con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/competitions/:id
 * Elimina competizione
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verifica esistenza
    const existing = await prisma.competition.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        _count: {
          select: {
            matches: true
          }
        }
      }
    });

    if (!existing) {
      throw new NotFoundError('Competizione non trovata');
    }

    // Verifica che non ci siano partite associate
    if (existing._count.matches > 0) {
      throw new BadRequestError('Non puoi eliminare una competizione con partite associate');
    }

    await prisma.competition.delete({
      where: { id }
    });

    res.json(ResponseFormatter.success(null, {
      message: 'Competizione eliminata con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/competitions/:id/standings
 * Classifica della competizione
 */
router.get('/:id/standings', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verifica esistenza competizione
    const competition = await prisma.competition.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!competition) {
      throw new NotFoundError('Competizione non trovata');
    }

    // Recupera tutte le partite della competizione
    const matches = await prisma.match.findMany({
      where: {
        competitionId: id,
        status: 'COMPLETED'
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    // Calcola classifica
    const standings = new Map<string, any>();

    matches.forEach(match => {
      // Inizializza team se non esistono
      if (!standings.has(match.homeTeamId)) {
        standings.set(match.homeTeamId, {
          teamId: match.homeTeamId,
          teamName: match.homeTeam?.name || 'Team',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        });
      }
      if (!standings.has(match.awayTeamId)) {
        standings.set(match.awayTeamId, {
          teamId: match.awayTeamId,
          teamName: match.awayTeam?.name || 'Team',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        });
      }

      // Aggiorna statistiche
      const homeStats = standings.get(match.homeTeamId);
      const awayStats = standings.get(match.awayTeamId);

      homeStats.played++;
      awayStats.played++;

      homeStats.goalsFor += match.homeScore || 0;
      homeStats.goalsAgainst += match.awayScore || 0;
      awayStats.goalsFor += match.awayScore || 0;
      awayStats.goalsAgainst += match.homeScore || 0;

      if ((match.homeScore || 0) > (match.awayScore || 0)) {
        // Vittoria casa
        homeStats.won++;
        homeStats.points += 3;
        awayStats.lost++;
      } else if ((match.awayScore || 0) > (match.homeScore || 0)) {
        // Vittoria trasferta
        awayStats.won++;
        awayStats.points += 3;
        homeStats.lost++;
      } else {
        // Pareggio
        homeStats.drawn++;
        awayStats.drawn++;
        homeStats.points += 1;
        awayStats.points += 1;
      }

      homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
      awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
    });

    // Converti Map in array e ordina
    const standingsArray = Array.from(standings.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamName.localeCompare(b.teamName);
      })
      .map((team, index) => ({
        ...team,
        position: index + 1
      }));

    res.json(ResponseFormatter.success({
      competition,
      standings: standingsArray,
      lastUpdated: new Date()
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
