          route: true,import { PrismaClient } from '@prisma/client';
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
      include: {
        _count: {
          select: { athletes: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return zones;
  }

  async getTransportZoneById(id: string, organizationId: string) {
    const zone = await prisma.transportZone.findFirst({
      where: { id, organizationId },
      include: {
        athletes: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true
          }
        }
      }
    });

    if (!zone) {
      throw new NotFoundError('Zona trasporto non trovata');
    }

    return zone;
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
      },
      include: {
        _count: {
          select: { athletes: true }
        }
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

    // Check for duplicate name if changing
    if (data.name && data.name !== zone.name) {
      const existing = await prisma.transportZone.findFirst({
        where: {
          organizationId,
          name: data.name,
          NOT: { id }
        }
      });

      if (existing) {
        throw new ConflictError('Zona trasporto con questo nome già esistente');
      }
    }

    const updated = await prisma.transportZone.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { athletes: true }
        }
      }
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

    return { success: true, message: 'Zona trasporto eliminata con successo' };
  }

  /**
   * GESTIONE PERCORSI (ROUTES)
   */
  async getTransportRoutes(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const routes = await prisma.transportRoute.findMany({
      where,
      include: {
        _count: {
          select: { schedules: true }
        }
      },
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
            match: true,
            session: true,
            _count: {
              select: { bookings: true }
            }
          },
          orderBy: { pickupTime: 'desc' },
          take: 10
        }
      }
    });

    if (!route) {
      throw new NotFoundError('Percorso non trovato');
    }

    return route;
  }

  async createTransportRoute(data: any, organizationId: string) {
    // Validate capacity
    if (data.capacity && data.capacity < 1) {
      throw new ValidationError('La capacità deve essere almeno 1');
    }

    const route = await prisma.transportRoute.create({
      data: {
        name: data.name,
        // description: data.description, // Campo non esiste nel DB
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        stops: data.stops || [],
        estimatedDuration: data.estimatedDuration,
        capacity: data.capacity || 50,
        vehicleType: data.vehicleType,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        notes: data.notes,
        isActive: data.isActive !== false,
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

    // Validate capacity if changing
    if (data.capacity !== undefined && data.capacity < 1) {
      throw new ValidationError('La capacità deve essere almeno 1');
    }

    const updated = await prisma.transportRoute.update({
      where: { id },
      data
    });

    return updated;
  }

  async deleteTransportRoute(id: string, organizationId: string) {
    const route = await prisma.transportRoute.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { 
            schedules: {
              where: {
                pickupTime: { gte: new Date() }
              }
            }
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundError('Percorso non trovato');
    }

    if (route._count.schedules > 0) {
      throw new BadRequestError(
        `Impossibile eliminare: ci sono ${route._count.schedules} viaggi programmati futuri`
      );
    }

    await prisma.transportRoute.delete({
      where: { id }
    });

    return { success: true, message: 'Percorso eliminato con successo' };
  }

  async assignDriverToRoute(routeId: string, driverName: string, driverPhone?: string, organizationId?: string) {
    const where: any = { id: routeId };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const route = await prisma.transportRoute.findFirst({ where });

    if (!route) {
      throw new NotFoundError('Percorso non trovato');
    }

    const updated = await prisma.transportRoute.update({
      where: { id: routeId },
      data: {
        // driverName, // Campo non esiste nel DB
        driverPhone
      }
    });

    return updated;
  }

  /**
   * GESTIONE SCHEDULE (PROGRAMMAZIONE VIAGGI)
   */
  async getTransportSchedules(organizationId: string, filters?: any) {
    const where: any = {};

    // Filter by match
    if (filters?.matchId) {
      where.matchId = filters.matchId;
    }

    // Filter by training session
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId;
    }

    // Filter by route
    if (filters?.routeId) {
      where.routeId = filters.routeId;
    }

    // Filter by status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filter by date
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

    // Filter by date range
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
            awayTeam: true,
            // venue: true // Relazione non esiste
          }
        },
        session: {
          include: {
            team: true
          }
        },
        bookings: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { pickupTime: 'asc' }
    });

    // Add computed fields
    const enrichedSchedules = schedules.map(schedule => ({
      ...schedule,
      availableSeats: schedule.route.capacity - schedule._count.bookings,
      isFull: schedule._count.bookings >= schedule.route.capacity
    }));

    return enrichedSchedules;
  }

  async getUpcomingSchedules(organizationId: string, days: number = 7) {
    const toDate = addDays(new Date(), days);

    return this.getTransportSchedules(organizationId, {
      fromDate: new Date(),
      toDate
    });
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

    if (!route.isActive) {
      throw new BadRequestError('Il percorso non è attivo');
    }

    // Validate match or session (must have one)
    if (!data.matchId && !data.sessionId) {
      throw new ValidationError('Devi specificare una partita o una sessione di allenamento');
    }

    if (data.matchId && data.sessionId) {
      throw new ValidationError('Non puoi specificare sia partita che allenamento');
    }

    // Validate match if provided
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

    // Validate session if provided
    if (data.sessionId) {
      const session = await prisma.trainingSession.findFirst({
        where: {
          id: data.sessionId,
          organizationId
        }
      });

      if (!session) {
        throw new NotFoundError('Sessione di allenamento non trovata');
      }
    }

    // Check for duplicate schedule
    const existing = await prisma.transportSchedule.findFirst({
      where: {
        routeId: data.routeId,
        pickupTime: new Date(data.pickupTime),
        OR: [
          { matchId: data.matchId || undefined },
          { sessionId: data.sessionId || undefined }
        ]
      }
    });

    if (existing) {
      throw new ConflictError('Esiste già un viaggio programmato per questo percorso e orario');
    }

    const schedule = await prisma.transportSchedule.create({
      data: {
        routeId: data.routeId,
        matchId: data.matchId || null,
        sessionId: data.sessionId || null,
        pickupTime: new Date(data.pickupTime),
        returnTime: data.returnTime ? new Date(data.returnTime) : null,
        notes: data.notes,
        status: 'scheduled'
      },
      include: {
        route: true,
        match: true,
        session: true
      }
    });

    return schedule;
  }

  async updateTransportSchedule(id: string, data: any, organizationId: string) {
    const schedule = await prisma.transportSchedule.findFirst({
      where: {
        id,
        route: {
          organizationId
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Programmazione trasporto non trovata');
    }

    // Check if schedule is in the past
    if (isBefore(new Date(schedule.pickupTime), new Date())) {
      throw new BadRequestError('Non puoi modificare un viaggio già effettuato');
    }

    const updated = await prisma.transportSchedule.update({
      where: { id },
      data: {
        pickupTime: data.pickupTime ? new Date(data.pickupTime) : undefined,
        returnTime: data.returnTime ? new Date(data.returnTime) : undefined,
        notes: data.notes,
        status: data.status
      },
      include: {
        route: true,
        match: true,
        session: true,
        _count: {
          select: { bookings: true }
        }
      }
    });

    return updated;
  }

  async updateScheduleStatus(id: string, status: string, organizationId: string) {
    const schedule = await prisma.transportSchedule.findFirst({
      where: {
        id,
        route: {
          organizationId
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Programmazione trasporto non trovata');
    }

    const validStatuses = ['scheduled', 'departed', 'arrived', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Stato non valido. Stati validi: ${validStatuses.join(', ')}`);
    }

    const updated = await prisma.transportSchedule.update({
      where: { id },
      data: { status }
    });

    // If cancelled, notify all booked athletes
    if (status === 'cancelled') {
      // TODO: Send notifications to all athletes with bookings
      const bookings = await prisma.transportBooking.findMany({
        where: { scheduleId: id },
        include: { athlete: true }
      });

      // Here you would send notifications
      console.log(`Notifying ${bookings.length} athletes about cancellation`);
    }

    return updated;
  }

  async deleteTransportSchedule(id: string, organizationId: string) {
    const schedule = await prisma.transportSchedule.findFirst({
      where: {
        id,
        route: {
          organizationId
        }
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Programmazione trasporto non trovata');
    }

    if (schedule._count.bookings > 0) {
      throw new BadRequestError(
        `Impossibile eliminare: ci sono ${schedule._count.bookings} prenotazioni attive`
      );
    }

    await prisma.transportSchedule.delete({
      where: { id }
    });

    return { success: true, message: 'Programmazione eliminata con successo' };
  }

  /**
   * GESTIONE PRENOTAZIONI (BOOKINGS)
   */
  async bookTransport(athleteId: string, scheduleId: string, data: any, organizationId: string) {
    // Validate athlete
    const athlete = await prisma.athlete.findFirst({
      where: {
        id: athleteId,
        organizationId
      }
    });

    if (!athlete) {
      throw new NotFoundError('Atleta non trovato');
    }

    // Validate schedule
    const schedule = await prisma.transportSchedule.findFirst({
      where: {
        id: scheduleId,
        route: {
          organizationId
        }
      },
      include: {
        route: true,
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Programmazione trasporto non trovata');
    }

    // Check if schedule is in the past
    if (isBefore(new Date(schedule.pickupTime), new Date())) {
      throw new BadRequestError('Non puoi prenotare un viaggio già partito');
    }

    // Check capacity
    if (schedule._count.bookings >= schedule.route.capacity) {
      throw new BadRequestError('Il mezzo è già pieno');
    }

    // Check for duplicate booking
    const existingBooking = await prisma.transportBooking.findFirst({
      where: {
        athleteId,
        scheduleId
      }
    });

    if (existingBooking) {
      throw new ConflictError('Atleta già prenotato per questo viaggio');
    }

    const booking = await prisma.transportBooking.create({
      data: {
        athleteId,
        scheduleId,
        pickupPoint: data.pickupPoint || schedule.route.startLocation,
        dropoffPoint: data.dropoffPoint || schedule.route.endLocation,
        notes: data.notes,
        status: 'confirmed' as TransportBookingStatus,
        bookedBy: data.bookedBy
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
            route: true,
            match: true,
            session: true
          }
        }
      }
    });

    return booking;
  }

  async cancelBooking(bookingId: string, organizationId: string, reason?: string) {
    const booking = await prisma.transportBooking.findFirst({
      where: {
        id: bookingId,
        schedule: {
          route: {
            organizationId
          }
        }
      },
      include: {
        schedule: true
      }
    });

    if (!booking) {
      throw new NotFoundError('Prenotazione non trovata');
    }

    // Check if schedule is in the past
    if (isBefore(new Date(booking.schedule.pickupTime), new Date())) {
      throw new BadRequestError('Non puoi cancellare una prenotazione per un viaggio già effettuato');
    }

    const updated = await prisma.transportBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled' as TransportBookingStatus,
        notes: reason ? `Cancellato: ${reason}` : 'Cancellato'
      }
    });

    return { success: true, message: 'Prenotazione cancellata con successo' };
  }

  async getBookingsBySchedule(scheduleId: string, organizationId: string) {
    // Verify schedule belongs to organization
    const schedule = await prisma.transportSchedule.findFirst({
      where: {
        id: scheduleId,
        route: {
          organizationId
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Programmazione trasporto non trovata');
    }

    const bookings = await prisma.transportBooking.findMany({
      where: {
        scheduleId,
        status: { not: 'cancelled' }
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            parentPhone: true,
            transportZone: true
          }
        }
      },
      orderBy: [
        { pickupPoint: 'asc' },
        { athlete: { lastName: 'asc' } }
      ]
    });

    return bookings;
  }

  async getAthleteBookings(athleteId: string, organizationId: string, includeHistory: boolean = false) {
    // Verify athlete belongs to organization
    const athlete = await prisma.athlete.findFirst({
      where: {
        id: athleteId,
        organizationId
      }
    });

    if (!athlete) {
      throw new NotFoundError('Atleta non trovato');
    }

    const where: any = {
      athleteId,
      status: { not: 'cancelled' }
    };

    if (!includeHistory) {
      where.schedule = {
        pickupTime: { gte: new Date() }
      };
    }

    const bookings = await prisma.transportBooking.findMany({
      where,
      include: {
        schedule: {
          include: {
            route: true,
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                venue: true
              }
            },
            session: {
              include: {
                team: true
              }
            }
          }
        }
      },
      orderBy: {
        schedule: {
          pickupTime: 'desc'
        }
      }
    });

    return bookings;
  }

  /**
   * FUNZIONI DI UTILITÀ E NOTIFICHE
   */
  async sendTransportReminders(hoursBeforeDeparture: number = 24) {
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hoursBeforeDeparture);

    const upcomingSchedules = await prisma.transportSchedule.findMany({
      where: {
        pickupTime: {
          gte: new Date(),
          lte: reminderTime
        },
        status: 'scheduled'
      },
      include: {
        route: true,
        match: true,
        session: true,
        bookings: {
          where: {
            status: 'confirmed'
          },
          include: {
            athlete: true
          }
        }
      }
    });

    const reminders = [];

    for (const schedule of upcomingSchedules) {
      for (const booking of schedule.bookings) {
        reminders.push({
          athleteId: booking.athlete.id,
          athleteName: `${booking.athlete.firstName} ${booking.athlete.lastName}`,
          scheduleId: schedule.id,
          pickupTime: schedule.pickupTime,
          pickupPoint: booking.pickupPoint,
          destination: schedule.match 
            ? `Partita: ${schedule.match.homeTeam?.name || 'Casa'} vs ${schedule.match.awayTeam?.name || 'Trasferta'}`
            : `Allenamento: ${schedule.session?.team?.name || 'Squadra'}`,
          driverName: schedule.route.driverName,
          driverPhone: schedule.route.driverPhone
        });
      }
    }

    // TODO: Integrate with notification service to send actual reminders
    console.log(`Sending ${reminders.length} transport reminders`);

    return {
      schedulesChecked: upcomingSchedules.length,
      remindersSent: reminders.length,
      reminders
    };
  }

  /**
   * STATISTICHE E REPORT
   */
  async getTransportStats(organizationId: string, dateRange?: { from: Date; to: Date }) {
    const where: any = {
      route: {
        organizationId
      }
    };

    if (dateRange) {
      where.pickupTime = {
        gte: dateRange.from,
        lte: dateRange.to
      };
    }

    const [totalSchedules, totalBookings, routeUsage, athleteUsage] = await Promise.all([
      // Total schedules
      prisma.transportSchedule.count({ where }),

      // Total bookings
      prisma.transportBooking.count({
        where: {
          schedule: where
        }
      }),

      // Route usage
      prisma.transportRoute.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              schedules: {
                where: dateRange ? {
                  pickupTime: where.pickupTime
                } : undefined
              }
            }
          }
        }
      }),

      // Most frequent travelers
      prisma.transportBooking.groupBy({
        by: ['athleteId'],
        where: {
          schedule: where,
          status: 'confirmed'
        },
        _count: true,
        orderBy: {
          _count: {
            athleteId: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Get athlete details for top travelers
    const topTravelers = await Promise.all(
      athleteUsage.map(async (usage) => {
        const athlete = await prisma.athlete.findUnique({
          where: { id: usage.athleteId },
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        });
        return {
          athlete,
          tripCount: usage._count
        };
      })
    );

    return {
      totalSchedules,
      totalBookings,
      averageOccupancy: totalSchedules > 0 ? (totalBookings / totalSchedules).toFixed(1) : 0,
      routeUsage: routeUsage.map(route => ({
        id: route.id,
        name: route.name,
        usageCount: route._count.schedules
      })),
      topTravelers,
      dateRange
    };
  }
}

export default TransportService;
