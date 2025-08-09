// backend/src/routes/payment.routes.ts
import { Router, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.middleware';
import { validate, validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { 
  createPaymentSchema,
  updatePaymentSchema,
  recordPaymentSchema,
  paymentFiltersSchema,
  paginationSchema,
  idParamSchema
} from '../validators/schemas';
import { z } from 'zod';
import { startOfMonth, endOfMonth } from 'date-fns';

const router = Router();
const paymentService = new PaymentService();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/payments
 * Recupera tutti i pagamenti con filtri e paginazione
 */
router.get('/', 
  validate({
    query: paymentFiltersSchema.merge(paginationSchema)
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const { 
        page = 1, 
        limit = 50, 
        sortBy = 'dueDate', 
        sortOrder = 'desc',
        ...filters 
      } = req.query as any;

      // Gestione filtro per mese
      if (filters.month) {
        const monthDate = new Date(filters.month + '-01');
        filters.fromDate = startOfMonth(monthDate);
        filters.toDate = endOfMonth(monthDate);
        delete filters.month;
      }

      const result = await paymentService.getPayments(
        organizationId,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/stats
 * Recupera statistiche pagamenti
 */
router.get('/stats',
  validate({
    query: z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      year: z.string().regex(/^\d{4}$/).optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const stats = await paymentService.getPaymentStats(
        organizationId,
        req.query.month as string,
        req.query.year as string
      );

      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/overdue
 * Recupera pagamenti in ritardo
 */
router.get('/overdue',
  authorize('payments:read'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const overduePayments = await paymentService.getOverduePayments(organizationId);

      res.json(ResponseFormatter.success(overduePayments, {
        message: `${overduePayments.length} pagamenti in ritardo`
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/upcoming
 * Recupera pagamenti in scadenza
 */
router.get('/upcoming',
  validate({
    query: z.object({
      days: z.string().regex(/^\d+$/).transform(Number).default('7')
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const upcomingPayments = await paymentService.getUpcomingPayments(
        organizationId,
        req.query.days as number
      );

      res.json(ResponseFormatter.success(upcomingPayments, {
        message: `${upcomingPayments.length} pagamenti in scadenza nei prossimi ${req.query.days} giorni`
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/athlete/:athleteId
 * Recupera pagamenti di un atleta
 */
router.get('/athlete/:athleteId',
  authorize('payments:read'),
  validate({
    params: z.object({
      athleteId: z.string().uuid()
    }),
    query: z.object({
      year: z.string().regex(/^\d{4}$/).optional(),
      status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const result = await paymentService.getPaymentsByAthlete(
        req.params.athleteId,
        organizationId,
        req.query as any
      );

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/:id
 * Recupera dettagli singolo pagamento
 */
router.get('/:id',
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const payment = await paymentService.getPaymentById(
        req.params.id,
        organizationId
      );

      res.json(ResponseFormatter.success(payment));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments
 * Crea nuovo pagamento
 */
router.post('/',
  authorize('payments:create'),
  validateBody(createPaymentSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const payment = await paymentService.createPayment(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(
        ResponseFormatter.success(payment, {
          message: 'Pagamento creato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/bulk
 * Crea pagamenti multipli
 */
router.post('/bulk',
  authorize('payments:create'),
  validateBody(z.object({
    athleteIds: z.array(z.string().uuid()).min(1),
    typeId: z.number().positive(),
    amount: z.number().positive(),
    dueDate: z.string().datetime(),
    description: z.string().optional()
  })),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await paymentService.createBulkPayments(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Creati ${result.created} pagamenti per ${result.athletes} atleti`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/payments/:id
 * Aggiorna pagamento
 */
router.put('/:id',
  authorize('payments:update'),
  validate({
    params: idParamSchema,
    body: updatePaymentSchema
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const payment = await paymentService.updatePayment(
        req.params.id,
        req.body,
        organizationId,
        userId
      );

      res.json(
        ResponseFormatter.success(payment, {
          message: 'Pagamento aggiornato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/:id/pay
 * Registra pagamento effettuato
 */
router.post('/:id/pay',
  authorize('payments:update'),
  validate({
    params: idParamSchema,
    body: recordPaymentSchema
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const payment = await paymentService.recordPayment(
        req.params.id,
        req.body,
        organizationId,
        userId
      );

      res.json(
        ResponseFormatter.success(payment, {
          message: 'Pagamento registrato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/:id/receipt
 * Genera ricevuta PDF
 */
router.post('/:id/receipt',
  authorize('payments:read'),
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      
      const receipt = await paymentService.generateReceipt(
        req.params.id,
        organizationId
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ricevuta-${req.params.id}.pdf"`);
      res.send(receipt);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/payments/:id
 * Cancella pagamento (solo se PENDING)
 */
router.delete('/:id',
  authorize('payments:delete'),
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      await paymentService.deletePayment(
        req.params.id,
        organizationId,
        userId
      );

      res.json(
        ResponseFormatter.success(null, {
          message: 'Pagamento cancellato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/send-reminders
 * Invia promemoria pagamenti
 */
router.post('/send-reminders',
  authorize('payments:manage'),
  validateBody(z.object({
    paymentIds: z.array(z.string().uuid()).optional(),
    daysBeforeDue: z.number().min(1).max(30).default(3)
  })),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      
      const result = await paymentService.sendPaymentReminders(
        organizationId,
        req.body.paymentIds,
        req.body.daysBeforeDue
      );

      res.json(
        ResponseFormatter.success(result, {
          message: `Inviati ${result.sent} promemoria`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/export
 * Esporta pagamenti in Excel/CSV
 */
router.get('/export',
  authorize('payments:read'),
  validate({
    query: z.object({
      format: z.enum(['excel', 'csv']).default('excel'),
      year: z.string().regex(/^\d{4}$/).optional(),
      month: z.string().regex(/^\d{1,2}$/).optional(),
      status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      
      const result = await paymentService.exportPayments(
        organizationId,
        req.query as any
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
