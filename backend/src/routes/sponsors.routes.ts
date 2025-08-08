// backend/src/routes/sponsors.routes.ts
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
 * GET /api/v1/sponsors
 * Lista sponsor
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { page = 1, limit = 20, status, search } = req.query;

    const where: any = {
      organizationId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [sponsors, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        skip,
        take: limit as number,
        orderBy: { startDate: 'desc' }
      }),
      prisma.sponsor.count({ where })
    ]);

    res.json(ResponseFormatter.paginated(
      sponsors,
      page as number,
      limit as number,
      total
    ));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/sponsors/:id
 * Dettaglio sponsor
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const sponsor = await prisma.sponsor.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!sponsor) {
      throw new NotFoundError('Sponsor non trovato');
    }

    res.json(ResponseFormatter.success(sponsor));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/sponsors
 * Aggiungi sponsor
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const {
      name,
      type,
      amount,
      startDate,
      endDate,
      contactPerson,
      contactEmail,
      contactPhone,
      notes,
      logoUrl
    } = req.body;

    // Validazione base
    if (!name || !type || !amount || !startDate) {
      throw new BadRequestError('Nome, tipo, importo e data inizio sono obbligatori');
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        organizationId,
        name,
        type,
        amount: parseFloat(amount),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        contactPerson,
        contactEmail,
        contactPhone,
        notes,
        logoUrl,
        status: 'ACTIVE'
      }
    });

    res.status(201).json(ResponseFormatter.success(sponsor, {
      message: 'Sponsor aggiunto con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/sponsors/:id
 * Aggiorna sponsor
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const updateData = req.body;

    // Verifica esistenza
    const existing = await prisma.sponsor.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Sponsor non trovato');
    }

    // Prepara dati aggiornamento
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: updateData
    });

    res.json(ResponseFormatter.success(sponsor, {
      message: 'Sponsor aggiornato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/sponsors/:id
 * Elimina sponsor
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verifica esistenza
    const existing = await prisma.sponsor.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Sponsor non trovato');
    }

    await prisma.sponsor.delete({
      where: { id }
    });

    res.json(ResponseFormatter.success(null, {
      message: 'Sponsor eliminato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/sponsors/stats
 * Statistiche sponsor
 */
router.get('/stats/summary', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;

    const [activeSponsors, totalRevenue, expiringSponsors] = await Promise.all([
      // Sponsor attivi
      prisma.sponsor.count({
        where: {
          organizationId,
          status: 'ACTIVE'
        }
      }),
      // Ricavi totali
      prisma.sponsor.aggregate({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        _sum: {
          amount: true
        }
      }),
      // Sponsor in scadenza (prossimi 30 giorni)
      prisma.sponsor.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date()
          }
        }
      })
    ]);

    res.json(ResponseFormatter.success({
      activeSponsors,
      totalRevenue: totalRevenue._sum.amount || 0,
      expiringSponsors,
      lastUpdated: new Date()
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
