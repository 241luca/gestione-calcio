// backend/src/routes/notification.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/errors';

const router = Router();
const notificationService = new NotificationService();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Recupera le notifiche dell'utente corrente
 */
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, priority, type, fromDate, toDate, page, limit } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (type) filters.type = type;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const pagination = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20
    };

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      filters,
      pagination
    );

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications
 * Crea una nuova notifica (solo admin/staff)
 */
router.post('/', 
  authorize('notifications:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const notificationData = {
        ...req.body,
        organizationId: req.user.organizationId
      };

      const notification = await notificationService.createNotification(notificationData);
      
      res.status(201).json(
        ResponseFormatter.success(notification, {
          message: 'Notifica creata con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notifications/:id/read
 * Segna una notifica come letta
 */
router.put('/:id/read', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.markAsRead(id, req.user.userId);
    
    res.json(
      ResponseFormatter.success(notification, {
        message: 'Notifica segnata come letta'
      })
    );
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/mark-all-read
 * Segna tutte le notifiche come lette
 */
router.put('/mark-all-read', async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    
    res.json(
      ResponseFormatter.success(result, {
        message: `${result.updated} notifiche segnate come lette`
      })
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Elimina una notifica
 */
router.delete('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await notificationService.deleteNotification(id, req.user.userId);
    
    res.json(
      ResponseFormatter.success(null, {
        message: 'Notifica eliminata con successo'
      })
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications/templates
 * Recupera i template di notifica disponibili
 */
router.get('/templates', 
  authorize('notifications:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const templates = await notificationService.getNotificationTemplates();
      
      res.json(ResponseFormatter.success(templates));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/templates
 * Crea un nuovo template personalizzato
 */
router.post('/templates',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const template = await notificationService.createCustomTemplate(req.body);
      
      res.status(201).json(
        ResponseFormatter.success(template, {
          message: 'Template creato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/send-bulk
 * Invia notifiche a più utenti
 */
router.post('/send-bulk',
  authorize('notifications:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { userIds, ...notificationData } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new BadRequestError('Lista utenti non valida');
      }

      const result = await notificationService.createBulkNotifications(
        userIds,
        {
          ...notificationData,
          organizationId: req.user.organizationId
        }
      );
      
      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `${result.created} notifiche inviate`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/send-to-organization
 * Invia notifica a tutta l'organizzazione
 */
router.post('/send-to-organization',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.notifyOrganization(
        req.user.organizationId,
        req.body
      );
      
      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Notifica inviata a ${result.created} utenti`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/send-to-team
 * Invia notifica a un team specifico
 */
router.post('/send-to-team/:teamId',
  authorize('notifications:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;
      
      const result = await notificationService.notifyTeam(
        teamId,
        {
          ...req.body,
          organizationId: req.user.organizationId
        }
      );
      
      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Notifica inviata al team`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/send-reminders
 * Invia promemoria automatici (chiamato da cron job o manualmente)
 */
router.post('/send-reminders',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      
      let result;
      switch (type) {
        case 'documents':
          result = await notificationService.sendDocumentExpiryNotifications();
          break;
        case 'payments':
          result = await notificationService.sendPaymentReminders();
          break;
        case 'matches':
          result = await notificationService.sendMatchReminders();
          break;
        case 'training':
          result = await notificationService.sendTrainingReminders();
          break;
        case 'all':
          const [docs, payments, matches, training] = await Promise.all([
            notificationService.sendDocumentExpiryNotifications(),
            notificationService.sendPaymentReminders(),
            notificationService.sendMatchReminders(),
            notificationService.sendTrainingReminders()
          ]);
          result = {
            documents: docs,
            payments: payments,
            matches: matches,
            training: training
          };
          break;
        default:
          throw new BadRequestError('Tipo di promemoria non valido');
      }
      
      res.json(
        ResponseFormatter.success(result, {
          message: 'Promemoria inviati con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notifications/stats
 * Recupera statistiche notifiche
 */
router.get('/stats',
  authorize('notifications:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const stats = await notificationService.getNotificationStats(
        req.user.organizationId
      );
      
      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export default router;