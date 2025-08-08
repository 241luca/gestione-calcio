// backend/src/routes/settings.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/errors';
import { EmailService } from '../services/email.service';
import OrganizationSettingsService from '../services/organization-settings.service';
import UserPreferencesService from '../services/user-preferences.service';
import NotificationTemplatesService from '../services/notification-templates.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const emailService = new EmailService();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

/**
 * GET /api/v1/settings/notifications
 * Recupera tutte le impostazioni notifiche DAL DATABASE
 */
router.get('/notifications', 
  authorize('settings:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Recupera VERE impostazioni dal database
      const settings = await OrganizationSettingsService.getAllSettings(
        req.user.organizationId
      );

      // Aggiungi statistiche REALI
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = {
        emailsSent: await prisma.emailLog.count({
          where: {
            organizationId: req.user.organizationId,
            status: 'SENT',
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        emailsFailed: await prisma.emailLog.count({
          where: {
            organizationId: req.user.organizationId,
            status: 'FAILED',
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        notificationsSent: await prisma.notification.count({
          where: {
            organizationId: req.user.organizationId,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        usersWithEmail: await prisma.user.count({
          where: {
            organizationId: req.user.organizationId,
            email: { not: '' }
          }
        })
      };

      res.json(ResponseFormatter.success({
        ...settings,
        stats
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/settings/notifications/email
 * Salva configurazione email NEL DATABASE
 */
router.post('/notifications/email',
  authorize('settings:write'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { apiKey, senderEmail, senderName, enabled, testMode } = req.body;

      // SALVA DAVVERO nel database
      const savedSettings = await OrganizationSettingsService.saveEmailSettings(
        req.user.organizationId,
        {
          apiKey,
          senderEmail,
          senderName,
          emailEnabled: enabled
        }
      );

      // Log l'azione
      await prisma.auditLog.create({
        data: {
          organizationId: req.user.organizationId,
          userId: req.user.userId,
          action: 'UPDATE',
          entityType: 'EMAIL_SETTINGS',
          newValues: { emailEnabled: enabled },
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });
      
      res.json(ResponseFormatter.success(
        savedSettings,
        { message: 'Impostazioni email salvate con successo nel database' }
      ));
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

      await emailService.sendEmail(
        req.user.organizationId,
        to || req.user.email,
        'Test Configurazione Email - Soccer Manager',
        testEmail,
        'Email di test dal sistema Soccer Manager'
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
            email: { not: '' }
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
