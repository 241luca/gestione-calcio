import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

// GET /api/v1/teams - Ottieni tutte le squadre
router.get('/', async (req: AuthRequest, res) => {
  try {
    console.log('📊 Recupero squadre per organizzazione:', req.user?.organizationId);
    
    const teams = await prisma.team.findMany({
      where: {
        organizationId: req.user?.organizationId
      },
      include: {
        _count: {
          select: {
            athletes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('❌ Errore recupero squadre:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore nel recupero delle squadre'
      }
    });
  }
});

// GET /api/v1/teams/:id - Ottieni singola squadra
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const team = await prisma.team.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user?.organizationId
      },
      include: {
        athletes: true,
        _count: {
          select: {
            athletes: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Squadra non trovata'
        }
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('❌ Errore recupero squadra:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore nel recupero della squadra'
      }
    });
  }
});

// POST /api/v1/teams - Crea nuova squadra
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, category, season, coach, assistantCoach } = req.body;

    // Validazione base
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nome e categoria sono obbligatori'
        }
      });
    }

    // Verifica che non esista già una squadra con lo stesso nome
    const existing = await prisma.team.findFirst({
      where: {
        name,
        organizationId: req.user?.organizationId
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Esiste già una squadra con questo nome'
        }
      });
    }

    const team = await prisma.team.create({
      data: {
        name,
        category,
        season: season || '2024/2025',
        coach: coach || '',
        assistantCoach: assistantCoach || '',
        organizationId: req.user?.organizationId!
      },
      include: {
        _count: {
          select: {
            athletes: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('❌ Errore creazione squadra:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore nella creazione della squadra'
      }
    });
  }
});

// PUT /api/v1/teams/:id - Aggiorna squadra
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, category, season, coach, assistantCoach } = req.body;

    // Verifica che la squadra esista e appartenga all'organizzazione
    const existing = await prisma.team.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user?.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Squadra non trovata'
        }
      });
    }

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(season && { season }),
        ...(coach !== undefined && { coach }),
        ...(assistantCoach !== undefined && { assistantCoach })
      },
      include: {
        _count: {
          select: {
            athletes: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento squadra:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore nell\'aggiornamento della squadra'
      }
    });
  }
});

// DELETE /api/v1/teams/:id - Elimina squadra
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Verifica che la squadra esista e non abbia atleti
    const team = await prisma.team.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user?.organizationId
      },
      include: {
        _count: {
          select: {
            athletes: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Squadra non trovata'
        }
      });
    }

    if (team._count.athletes > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_ATHLETES',
          message: `Non puoi eliminare una squadra con ${team._count.athletes} atleti. Sposta prima gli atleti in un'altra squadra.`
        }
      });
    }

    await prisma.team.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Squadra eliminata con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione squadra:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore nell\'eliminazione della squadra'
      }
    });
  }
});

export default router;
