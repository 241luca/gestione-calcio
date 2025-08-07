import { PrismaClient } from '@prisma/client';
import { 
  NotFoundError, 
  BadRequestError, 
  ConflictError,
  ValidationError 
} from '../utils/errors';

const prisma = new PrismaClient();

export class TransportService {
  /**
   * Gestione Zone Trasporto
   */
  async getTransportZones(organizationId: string) {
    const zones = await prisma.transportZone.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { athletes: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return zones;
  }

  async createTransportZone(data: any, organizationId: string) {
    // Check for duplicate name
    const existing = await prisma.transportZone.findFirst({
      where: {
        organizationId,
        name: data.name
      }
    });

    if (existing) {
      throw new ConflictError('Zona trasporto con questo nome già esistente');
    }

    const zone = await prisma.transportZone.create({
      data: {
        ...data,
        organizationId
      }
    });

    return zone;
  }

  async updateTransportZone(id: string, data: any, organizationId: string) {
    const zone = await prisma.transportZone.findFirst({
      where: { id, organizationId }
    });

    if (!zone) {
      throw new NotFoundError('Zona trasporto non trovata');
    }

    const updated = await prisma.transportZone.update({
      where: { id },
      data
    });

    return updated;
  }

  async deleteTransportZone(id: string, organizationId: string) {
    const zone = await prisma.transportZone.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { athletes: true }
        }
      }
    });

    if (!zone) {
      throw new NotFoundError('Zona trasporto non trovata');
    }

    if (zone._count.athletes > 0) {
      throw new BadRequestError(
        `Impossibile eliminare: ${zone._count.athletes} atleti assegnati a questa zona`
      );
    }

    await prisma.transportZone.delete({
      where: { id }
    });

    return { success: true };
  }

  /**
   * Gestione Percorsi
   */
  async getTransportRoutes(organizationId: string) {
    const routes = await prisma.transportRoute.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { schedules: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return routes;
  }

  async createTransportRoute(data: any, organizationId: string) {
    const route = await prisma.transportRoute.create({
      data: {
        ...data,
        organizationId
      }
    });

    return route;
  }

  async updateTransportRoute(id: string, data: any, organizationId: string) {
    const route = await prisma.transportRoute.findFirst({
      where: { id, organizationId }
    });

    if (!route) {
      throw new NotFoundError('Percorso non trovato');
    }

    const updated = await prisma.transportRoute.update({
      where: { id },
      data
    });

    return updated;
  }

  /**
   * Programmazione Trasporti
   */
  async getTransportSchedules(organizationId: string, filters?: any) {
    const where: any = {};

    if (filters?.matchId) {
      where.matchId = filters.matchId;
    }

    if (filters?.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.pickupTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const schedules = await prisma.transportSchedule.findMany({
      where: {
        ...where,
        route: {
          organizationId
        }
      },
      include: {
        route: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        },
        session: {
          include: {
            team: true
          }
        },
        bookings: {
          include: {
            athlete: true
          }
        }
      },
      orderBy: { pickupTime: 'asc' }
    });

    return schedules;
  }

  async createTransportSchedule(data: any, organizationId: string) {
    // Validate route belongs to organization
    const route = await prisma.transportRoute.findFirst({
      where: {
        id: data.routeId,
        organizationId
      }
    });

    if (!route) {
      throw new NotFoundError('Percorso non trovato');
    }

    // Validate match or session if provided
    if (data.matchId) {
      const match = await prisma.match.findFirst({
        where: {
          id: data.matchId,
          organizationId
        }
      });

      if (!match) {
        throw new NotFoundError('Partita non trovata');
      }
    }

    if (data.sessionId) {
      const session = await prisma.trainingSession.findFirst({
        where: {
          id: data.sessionId,
          organizationId
        }
      });

      if (!session) {
        