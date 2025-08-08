// backend/src/routes/staff.routes.ts
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
 * GET /api/v1/staff
 * Lista membri dello staff
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { page = 1, limit = 20, role, search } = req.query;

    const where: any = {
      organizationId
    };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit as number,
        orderBy: { lastName: 'asc' },
        include: {
          team: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    res.json(ResponseFormatter.paginated(
      staff,
      page as number,
      limit as number,
      total
    ));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/:id
 * Dettaglio membro staff
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const staffMember = await prisma.staff.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        team: true
      }
    });

    if (!staffMember) {
      throw new NotFoundError('Membro staff non trovato');
    }

    res.json(ResponseFormatter.success(staffMember));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/staff
 * Aggiungi membro staff
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const {
      firstName,
      lastName,
      role,
      email,
      phone,
      teamId,
      licenseNumber,
      licenseExpiry,
      qualifications
    } = req.body;

    // Validazione base
    if (!firstName || !lastName || !role) {
      throw new BadRequestError('Nome, cognome e ruolo sono obbligatori');
    }

    // Verifica email duplicata
    if (email) {
      const existing = await prisma.staff.findFirst({
        where: {
          email,
          organizationId
        }
      });

      if (existing) {
        throw new BadRequestError('Email già utilizzata');
      }
    }

    const staffMember = await prisma.staff.create({
      data: {
        organizationId,
        firstName,
        lastName,
        role,
        email,
        phone,
        teamId,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        qualifications
      },
      include: {
        team: true
      }
    });

    res.status(201).json(ResponseFormatter.success(staffMember, {
      message: 'Membro staff aggiunto con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/staff/:id
 * Aggiorna membro staff
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const updateData = req.body;

    // Verifica esistenza
    const existing = await prisma.staff.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Membro staff non trovato');
    }

    // Verifica email duplicata se cambiata
    if (updateData.email && updateData.email !== existing.email) {
      const emailExists = await prisma.staff.findFirst({
        where: {
          email: updateData.email,
          organizationId,
          id: { not: id }
        }
      });

      if (emailExists) {
        throw new BadRequestError('Email già utilizzata');
      }
    }

    // Prepara dati aggiornamento
    if (updateData.licenseExpiry) {
      updateData.licenseExpiry = new Date(updateData.licenseExpiry);
    }

    const staffMember = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        team: true
      }
    });

    res.json(ResponseFormatter.success(staffMember, {
      message: 'Membro staff aggiornato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/staff/:id
 * Elimina membro staff
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    // Verifica esistenza
    const existing = await prisma.staff.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existing) {
      throw new NotFoundError('Membro staff non trovato');
    }

    await prisma.staff.delete({
      where: { id }
    });

    res.json(ResponseFormatter.success(null, {
      message: 'Membro staff eliminato con successo'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/staff/roles
 * Lista ruoli disponibili
 */
router.get('/metadata/roles', async (req: AuthRequest, res, next) => {
  try {
    const roles = [
      { value: 'COACH', label: 'Allenatore' },
      { value: 'ASSISTANT_COACH', label: 'Allenatore in seconda' },
      { value: 'GOALKEEPER_COACH', label: 'Allenatore dei portieri' },
      { value: 'PHYSICAL_TRAINER', label: 'Preparatore atletico' },
      { value: 'MANAGER', label: 'Dirigente' },
      { value: 'MEDICAL', label: 'Staff medico' },
      { value: 'PHYSIOTHERAPIST', label: 'Fisioterapista' },
      { value: 'TEAM_MANAGER', label: 'Team Manager' },
      { value: 'EQUIPMENT_MANAGER', label: 'Magazziniere' },
      { value: 'OTHER', label: 'Altro' }
    ];

    res.json(ResponseFormatter.success(roles));
  } catch (error) {
    next(error);
  }
});

export default router;
