import { Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import SocketService from '../services/socket.service';
import { z } from 'zod';

const router = Router();
const paymentService = new PaymentService();

// Collega il SocketService al PaymentService per notifiche real-time
paymentService.setSocketService(SocketService);

// Schema di validazione per la creazione pagamento
const createPaymentSchema = z.object({
  athleteId: z.string().uuid(),
  typeId: z.number().positive(),
  amount: z.number().positive(),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional(),
  notes: z.string().optional()
});

// Schema per registrare un pagamento
const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().transform(str => new Date(str)),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

// Schema per pagamenti multipli
const bulkCreateSchema = z.object({
  athleteIds: z.array(z.string().uuid()),
  typeId: z.number().positive(),
  amount: z.number().positive(),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional()
});

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/payments
 * Recupera tutti i pagamenti dell'organizzazione con filtri opzionali
 */
router.get('/', authorize('payments:read'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 GET /payments - Recupero pagamenti organizzazione');
    const organizationId = req.user!.organizationId;
    
    // Parsing dei filtri dalla query string
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.athleteId) filters.athleteId = req.query.athleteId;
    if (req.query.typeId) filters.typeId = Number(req.query.typeId);
    if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
    if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

    const payments = await paymentService.getPaymentsByOrganization(organizationId, filters);

    res.json(ResponseFormatter.success(payments, {
      count: payments.length,
      filters
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/payments/athlete/:athleteId
 * Recupera tutti i pagamenti di un atleta specifico
 */
router.get('/athlete/:athleteId', authorize('payments:read'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 GET /payments/athlete - Pagamenti atleta:', req.params.athleteId);
    const organizationId = req.user!.organizationId;
    const { athleteId } = req.params;

    const result = await paymentService.getPaymentsByAthlete(athleteId, organizationId);

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments
 * Crea un nuovo pagamento
 */
router.post('/', authorize('payments:create'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 POST /payments - Creazione nuovo pagamento');
    const organizationId = req.user!.organizationId;

    // Valida i dati
    const validatedData = createPaymentSchema.parse(req.body);

    const payment = await paymentService.createPayment({
      organizationId,
      ...validatedData,
      createdById: req.user!.userId
    });

    res.status(201).json(ResponseFormatter.success(payment, {
      message: 'Pagamento creato con successo'
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json(ResponseFormatter.validationError(error.errors));
    }
    next(error);
  }
});

/**
 * PUT /api/v1/payments/:id
 * Aggiorna lo stato di un pagamento
 */
router.put('/:id', authorize('payments:update'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 PUT /payments/:id - Aggiornamento stato pagamento');
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(
        ResponseFormatter.error('VALIDATION_ERROR', 'Lo stato è obbligatorio')
      );
    }

    const payment = await paymentService.updatePaymentStatus(id, status, organizationId);

    res.json(ResponseFormatter.success(payment, {
      message: 'Stato pagamento aggiornato'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/:id/pay
 * Registra un pagamento effettuato
 */
router.post('/:id/pay', authorize('payments:update'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 POST /payments/:id/pay - Registrazione pagamento');
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    // Valida i dati
    const validatedData = recordPaymentSchema.parse(req.body);

    const payment = await paymentService.recordPayment(id, validatedData, organizationId);

    res.json(ResponseFormatter.success(payment, {
      message: 'Pagamento registrato con successo'
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json(ResponseFormatter.validationError(error.errors));
    }
    next(error);
  }
});

/**
 * GET /api/v1/payments/overdue
 * Recupera tutti i pagamenti scaduti
 */
router.get('/overdue', authorize('payments:read'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 GET /payments/overdue - Pagamenti scaduti');
    const organizationId = req.user!.organizationId;

    const result = await paymentService.getOverduePayments(organizationId);

    res.json(ResponseFormatter.success(result, {
      warning: result.stats.count > 0 ? `Ci sono ${result.stats.count} pagamenti scaduti` : null
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/payments/stats
 * Recupera le statistiche sui pagamenti
 */
router.get('/stats', authorize('payments:read'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 GET /payments/stats - Statistiche pagamenti');
    const organizationId = req.user!.organizationId;
    const month = req.query.month ? new Date(req.query.month as string) : undefined;

    const stats = await paymentService.getPaymentStats(organizationId, month);

    res.json(ResponseFormatter.success(stats));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/bulk
 * Crea pagamenti multipli (es. quota mensile per tutti)
 */
router.post('/bulk', authorize('payments:create'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 POST /payments/bulk - Creazione pagamenti multipli');
    const organizationId = req.user!.organizationId;

    // Valida i dati
    const validatedData = bulkCreateSchema.parse(req.body);

    const results = await paymentService.bulkCreatePayments({
      organizationId,
      ...validatedData,
      createdById: req.user!.userId
    });

    res.status(201).json(ResponseFormatter.success(results, {
      message: `Creati ${results.created.length} pagamenti su ${results.total}`
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json(ResponseFormatter.validationError(error.errors));
    }
    next(error);
  }
});

/**
 * GET /api/v1/payments/:id/receipt
 * Genera e scarica la ricevuta di un pagamento
 */
router.get('/:id/receipt', authorize('payments:read'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 GET /payments/:id/receipt - Generazione ricevuta');
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const receipt = await paymentService.generateReceipt(id, organizationId);

    res.json(ResponseFormatter.success(receipt, {
      message: 'Ricevuta generata'
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/send-reminders
 * Invia promemoria per pagamenti in scadenza
 */
router.post('/send-reminders', authorize('payments:admin'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 POST /payments/send-reminders - Invio promemoria');
    const organizationId = req.user!.organizationId;

    const result = await paymentService.sendPaymentReminders(organizationId);

    res.json(ResponseFormatter.success(result, {
      message: `Inviati ${result.remindersSent} promemoria`
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/check-overdue
 * Controlla e aggiorna i pagamenti scaduti
 */
router.post('/check-overdue', authorize('payments:admin'), async (req: AuthRequest, res, next) => {
  try {
    console.log('💰 POST /payments/check-overdue - Controllo pagamenti scaduti');

    const result = await paymentService.checkAndUpdateOverduePayments();

    res.json(ResponseFormatter.success(result, {
      message: `Aggiornati ${result.updated} pagamenti a OVERDUE`
    }));
  } catch (error) {
    next(error);
  }
});

// Export del router
export default router;
