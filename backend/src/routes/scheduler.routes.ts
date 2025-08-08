// backend/src/routes/scheduler.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/errors';

const router = Router();
const prisma = new PrismaClient();

// Configurazione jobs dello scheduler
const schedulerJobs = [
  {
    name: 'document-expiry-check',
    schedule: '0 9 * * *',
    description: 'Controllo documenti in scadenza',
    active: true,
    lastRun: null,
    nextRun: getNextRunTime('0 9 * * *')
  },
  {
    name: 'payment-reminders',
    schedule: '0 10 * * *',
    description: 'Invio promemoria pagamenti',
    active: true,
    lastRun: null,
    nextRun: getNextRunTime('0 10 * * *')
  },
  {
    name: 'match-reminders',
    schedule: '0 18 * * *',
    description: 'Promemoria partite del giorno successivo',
    active: true,
    lastRun: null,
    nextRun: getNextRunTime('0 18 * * *')
  },
  {
    name: 'backup-database',
    schedule: '0 2 * * *',
    description: 'Backup automatico database',
    active: true,
    lastRun: null,
    nextRun: getNextRunTime('0 2 * * *')
  },
  {
    name: 'cleanup-old-files',
    schedule: '0 3 * * 0',
    description: 'Pulizia file temporanei',
    active: false,
    lastRun: null,
    nextRun: null
  }
];

// Funzione helper per calcolare il prossimo run
function getNextRunTime(cronExpression: string): Date {
  const now = new Date();
  // Semplificazione - in produzione usa una libreria cron
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}

// GET /api/v1/scheduler/config
router.get('/config', authenticate, async (req, res, next) => {
  try {
    const settings = {
      documentsTime: '09:00',
      paymentsTime: '10:00',
      matchesTime: '18:00',
      documentsEnabled: true,
      paymentsEnabled: true,
      matchesEnabled: true,
      testMode: false
    };

    const stats = {
      lastDocumentCheck: new Date(Date.now() - 86400000).toISOString(),
      lastPaymentCheck: new Date(Date.now() - 86400000).toISOString(),
      lastMatchCheck: new Date(Date.now() - 43200000).toISOString(),
      totalNotificationsSent: 42,
      activeJobs: schedulerJobs.filter(j => j.active).length,
      totalJobs: schedulerJobs.length
    };

    res.json(ResponseFormatter.success({
      settings,
      jobs: schedulerJobs,
      stats
    }));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/scheduler/history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    // Simuliamo una cronologia di esecuzioni
    const history = [
      {
        id: 1,
        job: 'document-expiry-check',
        executedAt: new Date(Date.now() - 3600000).toISOString(),
        success: true,
        notificationsSent: 3,
        duration: 1250,
        message: 'Controllati 45 documenti, 3 in scadenza'
      },
      {
        id: 2,
        job: 'payment-reminders',
        executedAt: new Date(Date.now() - 7200000).toISOString(),
        success: true,
        notificationsSent: 5,
        duration: 890,
        message: 'Inviati 5 promemoria pagamenti'
      },
      {
        id: 3,
        job: 'match-reminders',
        executedAt: new Date(Date.now() - 10800000).toISOString(),
        success: true,
        notificationsSent: 12,
        duration: 650,
        message: 'Notificate 2 partite a 12 atleti'
      },
      {
        id: 4,
        job: 'backup-database',
        executedAt: new Date(Date.now() - 86400000).toISOString(),
        success: true,
        notificationsSent: 0,
        duration: 15230,
        message: 'Backup completato: 125MB'
      },
      {
        id: 5,
        job: 'document-expiry-check',
        executedAt: new Date(Date.now() - 90000000).toISOString(),
        success: false,
        notificationsSent: 0,
        duration: 120,
        message: 'Errore: Servizio email non disponibile'
      }
    ];

    res.json(ResponseFormatter.success(history));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/scheduler/run
router.post('/run', authenticate, async (req, res, next) => {
  try {
    const { jobName } = req.body;

    if (!jobName) {
      throw new BadRequestError('Nome job richiesto');
    }

    const job = schedulerJobs.find(j => j.name === jobName);
    if (!job) {
      throw new BadRequestError('Job non trovato');
    }

    // Simula l'esecuzione del job
    let result = {
      job: jobName,
      success: true,
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 2000).toISOString(),
      duration: 2000,
      notificationsSent: 0,
      message: ''
    };

    switch (jobName) {
      case 'document-expiry-check':
        result.notificationsSent = Math.floor(Math.random() * 10);
        result.message = `Controllati documenti, ${result.notificationsSent} notifiche inviate`;
        break;
      
      case 'payment-reminders':
        result.notificationsSent = Math.floor(Math.random() * 15);
        result.message = `Inviati ${result.notificationsSent} promemoria pagamenti`;
        break;
      
      case 'match-reminders':
        result.notificationsSent = Math.floor(Math.random() * 20);
        result.message = `Notificate partite a ${result.notificationsSent} atleti`;
        break;
      
      case 'backup-database':
        result.message = 'Backup database completato';
        break;
      
      case 'cleanup-old-files':
        result.message = 'Pulizia file completata';
        break;
    }

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/scheduler/config
router.put('/config', authenticate, async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      throw new BadRequestError('Impostazioni richieste');
    }

    // Qui salveresti le impostazioni nel database
    // Per ora le restituiamo come conferma

    res.json(ResponseFormatter.success({
      message: 'Configurazione aggiornata',
      settings
    }));
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/scheduler/toggle/:jobName
router.put('/toggle/:jobName', authenticate, async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const { active } = req.body;

    const job = schedulerJobs.find(j => j.name === jobName);
    if (!job) {
      throw new BadRequestError('Job non trovato');
    }

    job.active = active;
    
    res.json(ResponseFormatter.success({
      message: `Job ${jobName} ${active ? 'attivato' : 'disattivato'}`,
      job
    }));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/scheduler/stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;

    // Conta le notifiche reali dal database
    const [documentExpiring, paymentsOverdue, upcomingMatches] = await Promise.all([
      prisma.document.count({
        where: {
          organizationId,
          status: 'EXPIRING'
        }
      }),
      prisma.payment.count({
        where: {
          organizationId,
          status: 'OVERDUE'
        }
      }),
      prisma.match.count({
        where: {
          organizationId,
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 86400000) // Prossime 24 ore
          }
        }
      })
    ]);

    const stats = {
      pendingNotifications: {
        documents: documentExpiring,
        payments: paymentsOverdue,
        matches: upcomingMatches,
        total: documentExpiring + paymentsOverdue + upcomingMatches
      },
      lastExecution: {
        documents: new Date(Date.now() - 3600000).toISOString(),
        payments: new Date(Date.now() - 7200000).toISOString(),
        matches: new Date(Date.now() - 43200000).toISOString()
      },
      performance: {
        averageDuration: 1850,
        successRate: 95,
        totalExecutions: 156
      }
    };

    res.json(ResponseFormatter.success(stats));
  } catch (error) {
    next(error);
  }
});

export default router;
