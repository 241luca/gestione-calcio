import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { TransportService } from '../services/transport.service';

// Estendo il tipo Request per includere user
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  };
}

const router = Router();
const transportService = new TransportService();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * ZONE TRASPORTO
 */
// GET /api/v1/transport/zones - Lista zone
router.get('/zones', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const zones = await transportService.getTransportZones(
      req.user!.organizationId
    );
    res.json({ success: true, data: zones });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/zones/:id - Dettaglio zona
router.get('/zones/:id', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const zone = await transportService.getTransportZoneById(
      req.params.id,
      req.user!.organizationId
    );
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/transport/zones - Crea zona
router.post('/zones', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const zone = await transportService.createTransportZone(
      req.body,
      req.user!.organizationId
    );
    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/transport/zones/:id - Aggiorna zona
router.put('/zones/:id', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const zone = await transportService.updateTransportZone(
      req.params.id,
      req.body,
      req.user!.organizationId
    );
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/transport/zones/:id - Elimina zona
router.delete('/zones/:id', authorize('transport:delete'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await transportService.deleteTransportZone(
      req.params.id,
      req.user!.organizationId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * ROUTE TRASPORTO
 */
// GET /api/v1/transport/routes - Lista route
router.get('/routes', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const routes = await transportService.getTransportRoutes(
      req.user!.organizationId,
      req.query
    );
    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/routes/:id - Dettaglio route
router.get('/routes/:id', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const route = await transportService.getTransportRouteById(
      req.params.id,
      req.user!.organizationId
    );
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/transport/routes - Crea route
router.post('/routes', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const route = await transportService.createTransportRoute(
      req.body,
      req.user!.organizationId
    );
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/transport/routes/:id - Aggiorna route
router.put('/routes/:id', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const route = await transportService.updateTransportRoute(
      req.params.id,
      req.body,
      req.user!.organizationId
    );
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/transport/routes/:id - Elimina route
router.delete('/routes/:id', authorize('transport:delete'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await transportService.deleteTransportRoute(
      req.params.id,
      req.user!.organizationId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * SCHEDULE TRASPORTI
 */
// GET /api/v1/transport/schedules - Lista schedule
router.get('/schedules', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schedules = await transportService.getTransportSchedules(
      req.user!.organizationId,
      req.query
    );
    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/schedules/upcoming - Schedule prossimi
router.get('/schedules/upcoming', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const schedules = await transportService.getUpcomingSchedules(
      req.user!.organizationId,
      days
    );
    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/transport/schedules - Crea schedule
router.post('/schedules', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schedule = await transportService.createTransportSchedule(
      req.body,
      req.user!.organizationId
    );
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/transport/schedules/:id/status - Aggiorna stato
router.put('/schedules/:id/status', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schedule = await transportService.updateScheduleStatus(
      req.params.id,
      req.body.status,
      req.user!.organizationId
    );
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/transport/schedules/:id - Elimina schedule
router.delete('/schedules/:id', authorize('transport:delete'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await transportService.deleteTransportSchedule(
      req.params.id,
      req.user!.organizationId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PRENOTAZIONI
 */
// POST /api/v1/transport/bookings - Crea prenotazione
router.post('/bookings', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await transportService.bookTransport(
      req.body,
      req.user!.organizationId
    );
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/transport/bookings/:id - Cancella prenotazione
router.delete('/bookings/:id', authorize('transport:delete'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await transportService.cancelBooking(
      req.params.id,
      req.user!.organizationId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/bookings/schedule/:scheduleId - Prenotazioni per schedule
router.get('/bookings/schedule/:scheduleId', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await transportService.getBookingsBySchedule(
      req.params.scheduleId,
      req.user!.organizationId
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/bookings/athlete/:athleteId - Prenotazioni per atleta
router.get('/bookings/athlete/:athleteId', authorize('transport:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await transportService.getAthleteBookings(
      req.params.athleteId,
      req.user!.organizationId
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/transport/send-reminders - Invia promemoria
router.post('/send-reminders', authorize('transport:write'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await transportService.sendTransportReminders();
    res.json({ 
      success: true, 
      message: `Inviati ${result.remindersSent} promemoria per ${result.schedules} trasporti`,
      data: result 
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/transport/stats - Statistiche trasporti
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId;
    
    // Statistiche di base (dati simulati per ora)
    const stats = {
      totalZones: 5,
      activeRoutes: 12,
      upcomingSchedules: 8,
      todaySchedules: 3,
      totalBookings: 45,
      availableSeats: 120,
      occupiedSeats: 78,
      occupancyRate: 65,
      weeklyTrips: [
        { day: 'Lun', trips: 5, bookings: 42 },
        { day: 'Mar', trips: 4, bookings: 35 },
        { day: 'Mer', trips: 5, bookings: 48 },
        { day: 'Gio', trips: 4, bookings: 38 },
        { day: 'Ven', trips: 6, bookings: 52 },
        { day: 'Sab', trips: 8, bookings: 65 },
        { day: 'Dom', trips: 2, bookings: 15 }
      ],
      popularRoutes: [
        { name: 'Centro - Campo Sportivo', bookings: 125 },
        { name: 'Stazione - Palestra', bookings: 98 },
        { name: 'Scuola - Campo Est', bookings: 87 }
      ],
      recentBookings: [
        {
          id: '1',
          athleteName: 'Mario Rossi',
          route: 'Centro - Campo',
          date: new Date().toISOString(),
          status: 'confirmed'
        },
        {
          id: '2',
          athleteName: 'Luigi Verdi',
          route: 'Stazione - Palestra',
          date: new Date().toISOString(),
          status: 'confirmed'
        }
      ],
      success: true
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;