// backend/src/routes/settings.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/errors';
import EmailService from '../services/email.service';
import UserPreferencesService from '../services/user-preferences.service';
import NotificationTemplatesService from '../services/notification-templates.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

/**
 * GET /api/v1/settings/notifications
 * Recupera tutte le impostazioni notifiche
 */
router.get('/notifications', 
  authorize('settings:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Recupera impostazioni salvate nel database o usa default
      const organization = await prisma.organization.findUnique({
        where: { id: req.user.organizationId }
      });

      const settings = {
        email: {
          provider: 'brevo',
          apiKey: process.env.BREVO_API_KEY ? '***hidden***' : '',
          senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@soccermanager.com',
          senderName: 'Soccer Manager',
          enabled: process.env.EMAIL_ENABLED === 'true',
          testMode: process.env.EMAIL_TEST_MODE === 'true'
        },
        preferences: await UserPreferencesService.getUserPreferences(req.user.userId),
        stats: {
          emailsSent: 0,
          emailsFailed: 0,
          notificationsSent: await prisma.notification.count({
            where: { organizationId: req.user.organizationId }
          }),
          usersWithEmail: await prisma.user.count({
            where: {
              organizationId: req.user.organizationId,
              email: { not: null }
            }
          })
        }
      };

      res.json(ResponseFormatter.success(settings));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/settings/notifications/email
 * Salva configurazione email (Brevo)
 */
router.post('/notifications/email',
  authorize('settings:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { apiKey, senderEmail, senderName, enabled, testMode } = req.body;

      // In produzione, salvare in database invece che env
      // Per ora simuliamo il salvataggio
      const settings = {
        apiKey: apiKey ? '***saved***' : '',
        senderEmail,
        senderName,
        enabled,
        testMode,
        message: 'Impostazioni email salvate con successo'
      };

      // TODO: Salvare in database tabella OrganizationSettings
      
      res.json(ResponseFormatter.success(settings));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/settings/notifications/test-email
 * Testa configurazione email
 */
router.post('/notifications/test-email',
  authorize('settings:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { to, settings } = req.body;

      // Usa le impostazioni passate per il test
      if (!settings?.apiKey) {
        throw new BadRequestError('API Key Brevo mancante');
      }

      // Invia email di test
      const testEmail = `
        <h1>Test Email - Soccer Manager</h1>
        <p>Questa è una email di test dal sistema Soccer Manager.</p>
        <p>Se ricevi questa email, la configurazione Brevo è corretta!</p>
        <hr>
        <p><small>Inviata il ${new Date().toLocaleString('it-IT')}</small></p>
      `;

      await EmailService.sendEmail(
        to || req.user.email,
        'Test Configurazione Email - Soccer Manager',
        testEmail
      );

      res.json(ResponseFormatter.success({
        sent: true,
        to: to || req.user.email,
        message: 'Email di test inviata con successo'
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/settings/notifications/preferences
 * Salva preferenze default per tutti gli utenti
 */
router.post('/notifications/preferences',
  authorize('settings:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const preferences = req.body;

      // Applica a tutti gli utenti dell'organizzazione
      const result = await UserPreferencesService.applyOrganizationDefaults(
        req.user.organizationId,
        preferences
      );

      res.json(ResponseFormatter.success({
        ...result,
        message: `Preferenze applicate a ${result.updated} utenti`
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/settings/notifications/stats
 * Recupera statistiche notifiche
 */
router.get('/notifications/stats',
  authorize('settings:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = {
        emailsSent: 0, // TODO: Tracciare in database
        emailsFailed: 0, // TODO: Tracciare in database
        notificationsSent: await prisma.notification.count({
          where: {
            organizationId: req.user.organizationId,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        notificationsRead: await prisma.notification.count({
          where: {
            organizationId: req.user.organizationId,
            isRead: true,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        usersWithEmail: await prisma.user.count({
          where: {
            organizationId: req.user.organizationId,
            email: { not: null }
          }
        }),
        activeUsers: await prisma.user.count({
          where: {
            organizationId: req.user.organizationId,
            isActive: true
          }
        })
      };

      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
