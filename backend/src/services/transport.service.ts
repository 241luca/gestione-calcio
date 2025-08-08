import { PrismaClient } from '@prisma/client';
import { 
  NotFoundError, 
  BadRequestError, 
  ConflictError,
  ValidationError 
} from '../utils/errors';
import { addDays, format, isBefore, isAfter } from 'date-fns';

const prisma = new PrismaClient();

export class TransportService {
  /**
   * GESTIONE ZONE TRASPORTO
   */
  async getTransportZones(organizationId: string) {
    const zones = await prisma.transportZone.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });

    return zones;
  }

  async getTransportZoneById(id: string, organizationId: string) {
    const zone = await prisma.transportZone.findFirst({
      where: { id, organizationId }
    });

    if (!zone) {
      throw new NotFoundError('Zona trasporto non trovata');
    }

    return zone;
  }

  async createTransportZone(data: any, organizationId: string) {
    // Validazione
    if (!data.name) {
      throw new ValidationError('Nome zona richiesto');
    }

    // Verifica unicità nome
    const existing = await prisma.transportZone.findFirst({
      where: {
        organizationId,
        name: data.name
      }
    });

    if (existing) {
      throw new ConflictError('Esiste già una zona con questo nome');
    }

    const zone = await prisma.transportZone.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description
      }
    });

    return zone;
  }

  async updateTransportZone(id: string, data: any, organizationId: string) {
    // Verifica esistenza
    await this.getTransportZoneById(id, organizationId);

    // Se cambia nome, verifica unicità
    if (data.name) {
      const existing = await prisma.transportZone.findFirst({
        where: {
          organizationId,
          name: data.name,
          id: { not: id }
        }
      });

      if (existing) {
        throw new ConflictError('Esiste già una zona con questo nome');
      }
    }

    const updated = await prisma.transportZone.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });

    return updated;
  }

  async deleteTransportZone(id: string, organizationId: string) {
    // Verifica esistenza
    await this.getTransportZoneById(id, organizationId);

    // Nota: Non possiamo verificare routes associate perché non c'è relazione diretta nel DB
    // Ma possiamo comunque procedere con l'eliminazione

    await prisma.transportZone.delete({
      where: { id }
    });

    return { success: true, message: 'Zona eliminata con successo' };
  }

  /**
   * GESTIONE ROUTE TRASPORTO
   */
  async getTransportRoutes(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    const routes = await prisma.transportRoute.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return routes;
  }

  async getTransportRouteById(id: string, organizationId: string) {
    const route = await prisma.transportRoute.findFirst({
      where: { id, organizationId },
      include: {
        schedules: {
          include: {
            bookings: true
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundError('Route trasporto non trovata');
    }

    return route;
  }

  async createTransportRoute(data: any, organizationId: string) {
    // Validazione
    if (!data.name) {
      throw new ValidationError('Nome route richiesto');
    }

    const route = await prisma.transportRoute.create({
      data: {
        organizationId,
        name: data.name,
        driver: data.driver,
        vehiclePlate: data.vehiclePlate,
        capacity: data.capacity || 8
      }
    });

    return route;
  }

  async updateTransportRoute(id: string, data: any, organizationId: string) {
    // Verifica esistenza
    await this.getTransportRouteById(id, organizationId);

    const updated = await prisma.transportRoute.update({
      where: { id },
      data: {
        name: data.name,
        driver: data.driver,
        vehiclePlate: data.vehiclePlate,
        capacity: data.capacity
      }
    });

    return updated;
  }

  async deleteTransportRoute(id: string, organizationId: string) {
    // Verifica esistenza
    await this.getTransportRouteById(id, organizationId);

    // Verifica che non ci siano schedule futuri
    const futureSchedules = await prisma.transportSchedule.count({
      where: {
        routeId: id,
        pickupTime: { gte: new Date() }
      }
    });

    if (futureSchedules > 0) {
      throw new BadRequestError('Non puoi eliminare una route con viaggi programmati');
    }

    await prisma.transportRoute.delete({
      where: { id }
    });

    return { success: true, message: 'Route eliminata con successo' };
  }

  /**
   * GESTIONE SCHEDULE TRASPORTI
   */
  async getTransportSchedules(organizationId: string, filters?: any) {
    const where: any = {};
    
    // Join con route per filtrare per organization
    where.route = { organizationId };
    
    if (filters?.routeId) {
      where.routeId = filters.routeId;
    }
    
    if (filters?.matchId) {
      where.matchId = filters.matchId;
    }
    
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId;
    }
    
    if (filters?.fromDate) {
      where.pickupTime = { 
        ...where.pickupTime,
        gte: new Date(filters.fromDate) 
      };
    }
    
    if (filters?.toDate) {
      where.pickupTime = { 
        ...where.pickupTime,
        lte: new Date(filters.toDate) 
      };
    }

    const schedules = await prisma.transportSchedule.findMany({
      where,
      include: {
        route: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        },
        session: true,
        bookings: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { pickupTime: 'asc' }
    });

    return schedules;
  }

  async getUpcomingSchedules(organizationId: string, days: number = 7) {
    const fromDate = new Date();
    const toDate = addDays(fromDate, days);

    return this.getTransportSchedules(organizationId, {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString()
    });
  }

  async createTransportSchedule(data: any, organizationId: string) {
    // Validazione
    if (!data.routeId || !data.pickupTime) {
      throw new ValidationError('Route e orario partenza sono richiesti');
    }

    if (!data.matchId && !data.sessionId) {
      throw new ValidationError('Devi specificare una partita o un allenamento');
    }

    // Verifica che la route esista
    const route = await prisma.transportRoute.findFirst({
      where: { 
        id: data.routeId,
        organizationId
      }
    });

    if (!route) {
      throw new NotFoundError('Route non trovata');
    }

    // Calcola orario di ritorno
    const pickupTime = new Date(data.pickupTime);
    const returnTime = data.returnTime 
      ? new Date(data.returnTime)
      : addDays(pickupTime, 0.5); // Default: +12 ore

    const schedule = await prisma.transportSchedule.create({
      data: {
        routeId: data.routeId,
        matchId: data.matchId || null,
        sessionId: data.sessionId || null,
        pickupTime,
        returnTime,
        status: 'SCHEDULED',
        notes: data.notes
      },
      include: {
        route: true
      }
    });

    return schedule;
  }

  async updateScheduleStatus(id: string, status: string, organizationId: string) {
    // Verifica che lo schedule esista
    const schedule = await prisma.transportSchedule.findFirst({
      where: { 
        id,
        route: { organizationId }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule non trovato');
    }

    const updated = await prisma.transportSchedule.update({
      where: { id },
      data: { status }
    });

    return updated;
  }

  async deleteTransportSchedule(id: string, organizationId: string) {
    // Verifica che lo schedule esista
    const schedule = await prisma.transportSchedule.findFirst({
      where: { 
        id,
        route: { organizationId }
      },
      include: {
        bookings: true
      }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule non trovato');
    }

    if (schedule.bookings.length > 0) {
      throw new BadRequestError('Non puoi eliminare uno schedule con prenotazioni');
    }

    await prisma.transportSchedule.delete({
      where: { id }
    });

    return { success: true, message: 'Schedule eliminato con successo' };
  }

  /**
   * GESTIONE PRENOTAZIONI
   */
  async bookTransport(data: any, organizationId: string) {
    // Validazione
    if (!data.athleteId || !data.scheduleId) {
      throw new ValidationError('Atleta e schedule sono richiesti');
    }

    // Verifica che lo schedule esista
    const schedule = await prisma.transportSchedule.findFirst({
      where: { 
        id: data.scheduleId,
        route: { organizationId }
      },
      include: {
        route: true,
        bookings: true
      }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule non trovato');
    }

    // Verifica capacità
    if (schedule.bookings.length >= schedule.route.capacity) {
      throw new BadRequestError('Trasporto al completo');
    }

    // Verifica che l'atleta non sia già prenotato
    const existingBooking = await prisma.transportBooking.findFirst({
      where: {
        scheduleId: data.scheduleId,
        athleteId: data.athleteId
      }
    });

    if (existingBooking) {
      throw new ConflictError('Atleta già prenotato per questo trasporto');
    }

    const booking = await prisma.transportBooking.create({
      data: {
        scheduleId: data.scheduleId,
        athleteId: data.athleteId,
        status: 'CONFIRMED',
        pickupPoint: data.pickupPoint || 'Da definire',
        notes: data.notes
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        schedule: {
          include: {
            route: true
          }
        }
      }
    });

    return booking;
  }

  async cancelBooking(bookingId: string, organizationId: string) {
    // Verifica che la prenotazione esista
    const booking = await prisma.transportBooking.findFirst({
      where: { 
        id: bookingId,
        schedule: {
          route: { organizationId }
        }
      }
    });

    if (!booking) {
      throw new NotFoundError('Prenotazione non trovata');
    }

    await prisma.transportBooking.delete({
      where: { id: bookingId }
    });

    return { success: true, message: 'Prenotazione cancellata con successo' };
  }

  async getBookingsBySchedule(scheduleId: string, organizationId: string) {
    // Verifica che lo schedule esista
    const schedule = await prisma.transportSchedule.findFirst({
      where: { 
        id: scheduleId,
        route: { organizationId }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule non trovato');
    }

    const bookings = await prisma.transportBooking.findMany({
      where: { scheduleId },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            parentPhone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return bookings;
  }

  async getAthleteBookings(athleteId: string, organizationId: string) {
    const bookings = await prisma.transportBooking.findMany({
      where: { 
        athleteId,
        schedule: {
          route: { organizationId },
          pickupTime: { gte: new Date() } // Solo futuri
        }
      },
      include: {
        schedule: {
          include: {
            route: true,
            match: {
              include: {
                homeTeam: true,
                awayTeam: true
              }
            },
            session: true
          }
        }
      },
      orderBy: {
        schedule: {
          pickupTime: 'asc'
        }
      }
    });

    return bookings;
  }

  /**
   * UTILITY E NOTIFICHE
   */
  async sendTransportReminders() {
    // Trova tutti i trasporti del giorno dopo
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    const schedules = await prisma.transportSchedule.findMany({
      where: {
        pickupTime: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        },
        status: 'SCHEDULED'
      },
      include: {
        bookings: {
          include: {
            athlete: true
          }
        },
        route: true
      }
    });

    let remindersSent = 0;

    for (const schedule of schedules) {
      for (const booking of schedule.bookings) {
        // Qui andrebbe implementato l'invio notifica
        console.log(`📧 Promemoria trasporto per ${booking.athlete.firstName} ${booking.athlete.lastName}`);
        remindersSent++;
      }
    }

    return { 
      schedules: schedules.length,
      remindersSent 
    };
  }
}