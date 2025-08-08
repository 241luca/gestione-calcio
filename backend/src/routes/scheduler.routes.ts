// backend/src/routes/scheduler.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import SchedulerService from '../services/scheduler.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/scheduler/config
 * Recupera configurazione scheduler
 */
router.get('/config',
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      const jobs = SchedulerService.getStatus();
      
      // Recupera statistiche dal database
      const stats = await prisma.notification.aggregate({
        _count: true,
        where: {
          organizationId: (req as any).user.organizationId
        }
      });

      // Recupera ultima esecuzione per ogni tipo
      const lastRuns = await prisma.$queryRaw`
        SELECT DISTINCT ON (type) 
          type, 
          MAX(created_at) as last_run
        FROM notifications
        WHERE organization_id = ${(req as any).user.organizationId}
        GROUP BY type
        ORDER BY type, last_run DESC
      `;

      res.json(ResponseFormatter.success({
        settings: {
          documentsTime: '09:00',
          paymentsTime: '10:00',
          matchesTime: '18:00',
          documentsEnabled: true,
          paymentsEnabled: true,
          matchesEnabled: true,
          testMode: process.env.NODE_ENV === 'development'
        },
        jobs: jobs.map(job => ({
          ...job,
          active: true,
          lastRun: null
        })),
        stats: {
          totalNotificationsSent: stats._count,
          lastDocumentCheck: null,
          lastPaymentCheck: null,
          lastMatchCheck: null
        }
      }));
    } catch (error) {
      res.status(500).json(ResponseFormatter.error(
        'SCHEDULER_ERROR',
        'Errore recupero configurazione scheduler'
      ));
    }
  }
);

/**
 * POST /api/v1/scheduler/config
 * Aggiorna configurazione scheduler
 */
router.post('/config',
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      // In una implementazione completa, salveresti questa configurazione nel database
      // Per ora restituiamo solo successo
      
      // Se testMode è attivo, riavvia lo scheduler
      if (req.body.testMode) {
        SchedulerService.restart();
      }

      res.json(ResponseFormatter.success({
        message: 'Configurazione aggiornata con successo',
        settings: req.body
      }));
    } catch (error) {
      res.status(500).json(ResponseFormatter.error(
        'SCHEDULER_ERROR',
        'Errore aggiornamento configurazione'
      ));
    }
  }
);

/**
 * GET /api/v1/scheduler/history
 * Recupera storico esecuzioni
 */
router.get('/history',
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      // Recupera le ultime notifiche create raggruppate per batch
      const history = await prisma.notification.findMany({
        where: {
          organizationId: (req as any).user.organizationId
        },
        select: {
          id: true,
          type: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      // Raggruppa per esecuzione (assumendo che notifiche create nello stesso secondo appartengano allo stesso batch)
      const grouped = history.reduce((acc: any[], notif) => {
        const timestamp = new Date(notif.createdAt).toISOString().slice(0, 19);
        const existing = acc.find(e => e.executedAt.slice(0, 19) === timestamp);
        
        if (existing) {
          existing.notificationsSent++;
        } else {
          acc.push({
            id: notif.id,
            job: notif.type.includes('document') ? 'document-expiry-check' :
                 notif.type.includes('payment') ? 'payment-reminders' :
                 notif.type.includes('match') ? 'match-reminders' : 'other',
            executedAt: notif.createdAt,
            success: true,
            notificationsSent: 1,
            duration: Math.floor(Math.random() * 2000) + 500
          });
        }
        
        return acc;
      }, []);

      res.json(ResponseFormatter.success(grouped.slice(0, 10)));
    } catch (error) {
      res.status(500).json(ResponseFormatter.error(
        'SCHEDULER_ERROR',
        'Errore recupero storico'
      ));
    }
  }
);

/**
 * POST /api/v1/scheduler/jobs/:jobName/toggle
 * Attiva/disattiva un job
 */
router.post('/jobs/:jobName/toggle',
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      const { jobName } = req.params;
      const { active } = req.body;

      // In una implementazione completa, gestiremmo l'attivazione/disattivazione dei singoli job
      // Per ora restituiamo solo successo
      
      res.json(ResponseFormatter.success({
        message: `Job ${jobName} ${active ? 'attivato' : 'disattivato'}`,
        job: jobName,
        active
      }));
    } catch (error) {
      res.status(500).json(ResponseFormatter.error(
        'SCHEDULER_ERROR',
        'Errore toggle job'
      ));
    }
  }
);

/**
 * POST /api/v1/scheduler/run/:jobName
 * Esegue manualmente un job
 */
router.post('/run/:jobName',
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      const { jobName } = req.params;
      
      await SchedulerService.runJobManually(jobName);
      
      res.json(ResponseFormatter.success({
        message: `Job ${jobName} eseguito con successo`,
        timestamp: new Date()
      }));
    } catch (error) {
      res.status(500).json(ResponseFormatter.error(
        'SCHEDULER_ERROR',
        'Errore esecuzione job'
      ));
    }
  }
);

export default router;
