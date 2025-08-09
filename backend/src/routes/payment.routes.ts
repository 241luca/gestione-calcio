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
        { page, limit } // Rimosso sortBy e sortOrder che non sono supportati
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
      
      // getPaymentStats accetta solo organizationId e un Date opzionale per il mese
      let monthDate: Date | undefined;
      if (req.query.month) {
        monthDate = new Date(req.query.month + '-01');
      }
      
      const stats = await paymentService.getPaymentStats(
        organizationId,
        monthDate
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
      const result = await paymentService.getOverduePayments(organizationId);

      res.json(ResponseFormatter.success(result, {
        message: `${result.payments.length} pagamenti in ritardo`
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
      const days = Number(req.query.days) || 7;
      
      const upcomingPayments = await paymentService.getUpcomingPayments(
        organizationId,
        days
      );

      res.json(ResponseFormatter.success(upcomingPayments, {
        message: `${upcomingPayments.length} pagamenti in scadenza nei prossimi ${days} giorni`
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
        organizationId
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

      const paymentData = {
        ...req.body,
        organizationId,
        createdById: userId,
        dueDate: new Date(req.body.dueDate)
      };

      const payment = await paymentService.createPayment(paymentData);

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

      const bulkData = {
        ...req.body,
        organizationId,
        createdById: userId,
        dueDate: new Date(req.body.dueDate)
      };

      const result = await paymentService.createBulkPayments(bulkData);

      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Creati ${result.created.length} pagamenti su ${result.total}`
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

      const updateData = {
        ...req.body,
        ...(req.body.dueDate && { dueDate: new Date(req.body.dueDate) })
      };

      const payment = await paymentService.updatePayment(
        req.params.id,
        organizationId,
        updateData
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

      const paymentData = {
        ...req.body,
        paymentDate: new Date(req.body.paymentDate)
      };

      const payment = await paymentService.recordPayment(
        req.params.id,
        paymentData,
        organizationId
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

      res.json(ResponseFormatter.success(receipt, {
        message: 'Ricevuta generata con successo'
      }));
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

      await paymentService.deletePayment(
        req.params.id,
        organizationId
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
      
      const result = await paymentService.sendPaymentReminders(organizationId);

      res.json(
        ResponseFormatter.success(result, {
          message: `Inviati ${result.remindersSent} promemoria`
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
      const format = req.query.format || 'excel';
      
      const result = await paymentService.exportPayments(
        organizationId,
        format as string,
        req.query as any
      );

      res.json(ResponseFormatter.success(result, {
        message: 'Export generato con successo'
      }));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
