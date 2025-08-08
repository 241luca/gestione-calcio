// backend/src/routes/venues.routes.ts
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
 * GET /api/v1/venues
 * Lista campi da gioco
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
        { address: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit as number,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              matches: true
            }
          }
        }
      }),
      prisma.venue.count({ where })
    ]);

    res.json(ResponseFormatter.paginated(
      venues,
      page as number,
      limit as number,
      total
    ));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/venues/:id
 * Dettaglio campo
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const venue = await prisma.venue.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        matches: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            homeTeam: true,
            awayTeam: true
          }
        }
      }
    });

    if (!venue) {
      throw new NotFoundError('Campo non trovato');
    }

    res.json(ResponseFormatter.success(venue));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/venues
 * Aggiungi campo
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const {
      name,
      address,
      city,
      province,
      capacity,
      type,
      isHome,
      notes
    } = req.body;

    // Validazione base
    if (!name || !address || !city) {
      throw new BadRequestError('Nome, indirizzo e città sono obbligatori');
    }

    const venue = await prisma.venue.create({
      data: {
        organizationId,
        name,
        address,
        city,
        province,
        capacity: capacity ? parseInt(capacity) : null,
        type: type || 'GRASS',
        isHome: isHome || false,
        notes
      }
    });

    res.status(201).json(ResponseFormatter.success(venue, {
      message: 'Campo aggiunto con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/venues/:id
 * Aggiorna campo
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const updateData = req.body;

    // Verifica esistenza
    const existing = await prisma.venue.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Campo non trovato');
    }

    // Prepara dati aggiornamento
    if (updateData.capacity) {
      updateData.capacity = parseInt(updateData.capacity);
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: updateData
    });

    res.json(ResponseFormatter.success(venue, {
      message: 'Campo aggiornato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/venues/:id
 * Elimina campo
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verifica esistenza
    const existing = await prisma.venue.findFirst({
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
      throw new NotFoundError('Campo non trovato');
    }

    // Verifica che non ci siano partite future associate
    const futureMatches = await prisma.match.count({
      where: {
        venueId: id,
        date: {
          gte: new Date()
        }
      }
    });

    if (futureMatches > 0) {
      throw new BadRequestError('Non puoi eliminare un campo con partite programmate');
    }

    await prisma.venue.delete({
      where: { id }
    });

    res.json(ResponseFormatter.success(null, {
      message: 'Campo eliminato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
