import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { TransportService } from '../services/transport.service';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();
const transportService = new TransportService();

// Apply authentication to all routes
router.use(authenticate);

/**
 * TRANSPORT ZONES ROUTES
 */

// GET /api/v1/transport/zones - Get all transport zones
router.get('/zones', 
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const zones = await transportService.getTransportZones(req.user.organizationId);
      res.json(ResponseFormatter.success(zones));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/zones/:id - Get single transport zone
router.get('/zones/:id',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const zone = await transportService.getTransportZoneById(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(zone));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/transport/zones - Create transport zone
router.post('/zones',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const zone = await transportService.createTransportZone(
        req.body,
        req.user.organizationId
      );
      res.status(201).json(ResponseFormatter.success(zone));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/transport/zones/:id - Update transport zone
router.put('/zones/:id',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const zone = await transportService.updateTransportZone(
        req.params.id,
        req.body,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(zone));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/transport/zones/:id - Delete transport zone
router.delete('/zones/:id',
  authorize('transport:delete'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await transportService.deleteTransportZone(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * TRANSPORT ROUTES ROUTES
 */

// GET /api/v1/transport/routes - Get all transport routes
router.get('/routes',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };

      const routes = await transportService.getTransportRoutes(
        req.user.organizationId,
        filters
      );
      res.json(ResponseFormatter.success(routes));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/routes/:id - Get single transport route
router.get('/routes/:id',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const route = await transportService.getTransportRouteById(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(route));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/transport/routes - Create transport route
router.post('/routes',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const route = await transportService.createTransportRoute(
        req.body,
        req.user.organizationId
      );
      res.status(201).json(ResponseFormatter.success(route));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/transport/routes/:id - Update transport route
router.put('/routes/:id',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const route = await transportService.updateTransportRoute(
        req.params.id,
        req.body,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(route));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/transport/routes/:id/driver - Assign driver to route
router.put('/routes/:id/driver',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { driverName, driverPhone } = req.body;
      
      if (!driverName) {
        return res.status(400).json(
          ResponseFormatter.error('VALIDATION_ERROR', 'Nome autista richiesto')
        );
      }

      const route = await transportService.assignDriverToRoute(
        req.params.id,
        driverName,
        driverPhone,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(route));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/transport/routes/:id - Delete transport route
router.delete('/routes/:id',
  authorize('transport:delete'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await transportService.deleteTransportRoute(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * TRANSPORT SCHEDULES ROUTES
 */

// GET /api/v1/transport/schedules - Get all schedules
router.get('/schedules',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const filters = {
        matchId: req.query.matchId,
        sessionId: req.query.sessionId,
        routeId: req.query.routeId,
        status: req.query.status,
        date: req.query.date,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };

      const schedules = await transportService.getTransportSchedules(
        req.user.organizationId,
        filters
      );
      res.json(ResponseFormatter.success(schedules));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/schedules/upcoming - Get upcoming schedules
router.get('/schedules/upcoming',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 7;
      const schedules = await transportService.getUpcomingSchedules(
        req.user.organizationId,
        days
      );
      res.json(ResponseFormatter.success(schedules));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/transport/schedules - Create schedule
router.post('/schedules',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const schedule = await transportService.createTransportSchedule(
        req.body,
        req.user.organizationId
      );
      res.status(201).json(ResponseFormatter.success(schedule));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/transport/schedules/:id - Update schedule
router.put('/schedules/:id',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const schedule = await transportService.updateTransportSchedule(
        req.params.id,
        req.body,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(schedule));
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/transport/schedules/:id/status - Update schedule status
router.put('/schedules/:id/status',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json(
          ResponseFormatter.error('VALIDATION_ERROR', 'Stato richiesto')
        );
      }

      const schedule = await transportService.updateScheduleStatus(
        req.params.id,
        status,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(schedule));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/transport/schedules/:id - Delete schedule
router.delete('/schedules/:id',
  authorize('transport:delete'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await transportService.deleteTransportSchedule(
        req.params.id,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * TRANSPORT BOOKINGS ROUTES
 */

// POST /api/v1/transport/bookings - Create booking
router.post('/bookings',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { athleteId, scheduleId, pickupPoint, dropoffPoint, notes } = req.body;

      if (!athleteId || !scheduleId) {
        return res.status(400).json(
          ResponseFormatter.error('VALIDATION_ERROR', 'Atleta e programmazione richiesti')
        );
      }

      const booking = await transportService.bookTransport(
        athleteId,
        scheduleId,
        {
          pickupPoint,
          dropoffPoint,
          notes,
          bookedBy: req.user.userId
        },
        req.user.organizationId
      );
      res.status(201).json(ResponseFormatter.success(booking));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/transport/bookings/:id - Cancel booking
router.delete('/bookings/:id',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await transportService.cancelBooking(
        req.params.id,
        req.user.organizationId,
        req.body.reason
      );
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/bookings/athlete/:athleteId - Get athlete bookings
router.get('/bookings/athlete/:athleteId',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const includeHistory = req.query.includeHistory === 'true';
      const bookings = await transportService.getAthleteBookings(
        req.params.athleteId,
        req.user.organizationId,
        includeHistory
      );
      res.json(ResponseFormatter.success(bookings));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/bookings/schedule/:scheduleId - Get schedule bookings
router.get('/bookings/schedule/:scheduleId',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const bookings = await transportService.getBookingsBySchedule(
        req.params.scheduleId,
        req.user.organizationId
      );
      res.json(ResponseFormatter.success(bookings));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * UTILITY ROUTES
 */

// POST /api/v1/transport/reminders - Send transport reminders
router.post('/reminders',
  authorize('transport:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const hoursBeforeDeparture = req.body.hours || 24;
      const result = await transportService.sendTransportReminders(hoursBeforeDeparture);
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/transport/stats - Get transport statistics
router.get('/stats',
  authorize('transport:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const dateRange = req.query.from && req.query.to ? {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      } : undefined;

      const stats = await transportService.getTransportStats(
        req.user.organizationId,
        dateRange
      );
      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
