import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/competitions
 * Recupera tutte le competizioni
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    
    const competitions = await prisma.competition.findMany({
      where: { organizationId },
      include: { 
        matches: true,
        teams: true 
      },
      orderBy: { startDate: 'desc' }
    });
    
    res.json(ResponseFormatter.success(competitions));
  } catch (error) {
    console.error('Errore in GET /competitions:', error);
    next(error);
  }
});

/**
 * POST /api/v1/competitions
 * Crea una nuova competizione
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    
    const competition = await prisma.competition.create({
      data: {
        organizationId,
        name: req.body.name,
        type: req.body.type || 'CAMPIONATO',
        season: req.body.season,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        description: req.body.description
      }
    });
    
    res.status(201).json(
      ResponseFormatter.success(competition, {
        message: 'Competizione creata con successo'
      })
    );
  } catch (error) {
    console.error('Errore in POST /competitions:', error);
    next(error);
  }
});

/**
 * GET /api/v1/competitions/:id
 * Recupera una competizione specifica
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    
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
          }
        },
        teams: true
      }
    });
    
    if (!competition) {
      return res.status(404).json(
        ResponseFormatter.error('NOT_FOUND', 'Competizione non trovata')
      );
    }
    
    res.json(ResponseFormatter.success(competition));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/competitions/:id/standings
 * Calcola e restituisce la classifica
 */
router.get('/:id/standings', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    
    // Recupera tutte le partite della competizione
    const matches = await prisma.match.findMany({
      where: {
        competitionId: id,
        organizationId,
        status: 'COMPLETED'
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });
    
    // Calcola la classifica
    const standings = calculateStandings(matches);
    
    res.json(ResponseFormatter.success(standings));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/competitions/:id
 * Aggiorna una competizione
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    
    const competition = await prisma.competition.updateMany({
      where: { 
        id,
        organizationId 
      },
      data: {
        name: req.body.name,
        type: req.body.type,
        season: req.body.season,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        description: req.body.description
      }
    });
    
    if (competition.count === 0) {
      return res.status(404).json(
        ResponseFormatter.error('NOT_FOUND', 'Competizione non trovata')
      );
    }
    
    res.json(ResponseFormatter.success({ message: 'Competizione aggiornata' }));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/competitions/:id
 * Elimina una competizione
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    
    const competition = await prisma.competition.deleteMany({
      where: { 
        id,
        organizationId 
      }
    });
    
    if (competition.count === 0) {
      return res.status(404).json(
        ResponseFormatter.error('NOT_FOUND', 'Competizione non trovata')
      );
    }
    
    res.json(ResponseFormatter.success({ message: 'Competizione eliminata' }));
  } catch (error) {
    next(error);
  }
});

// Funzione helper per calcolare la classifica
function calculateStandings(matches: any[]) {
  const teams: Map<string, any> = new Map();
  
  matches.forEach(match => {
    // Inizializza squadre se non esistono
    if (!teams.has(match.homeTeamId)) {
      teams.set(match.homeTeamId, {
        teamId: match.homeTeamId,
        teamName: match.homeTeam.name,
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
    
    if (!teams.has(match.awayTeamId)) {
      teams.set(match.awayTeamId, {
        teamId: match.awayTeamId,
        teamName: match.awayTeam.name,
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
    
    const home = teams.get(match.homeTeamId);
    const away = teams.get(match.awayTeamId);
    
    // Aggiorna statistiche
    home.played++;
    away.played++;
    home.goalsFor += match.homeScore || 0;
    home.goalsAgainst += match.awayScore || 0;
    away.goalsFor += match.awayScore || 0;
    away.goalsAgainst += match.homeScore || 0;
    
    // Calcola punti
    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.awayScore > match.homeScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
    
    // Calcola differenza reti
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });
  
  // Converti in array e ordina per punti, differenza reti, gol fatti
  const standings = Array.from(teams.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  
  // Aggiungi posizione
  standings.forEach((team, index) => {
    team.position = index + 1;
  });
  
  return standings;
}

export default router;
