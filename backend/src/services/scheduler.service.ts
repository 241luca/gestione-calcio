// backend/src/services/scheduler.service.ts
import * as cron from 'node-cron';
import { NotificationService } from './notification.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

class SchedulerService {
  private jobs: Map<string, any> = new Map();

  /**
   * Inizializza tutti i job schedulati
   */
  initialize() {
    console.log('⏰ Inizializzazione scheduler...');

    // Job giornaliero per documenti in scadenza (ogni giorno alle 9:00)
    this.scheduleJob('document-expiry-check', '0 9 * * *', async () => {
      console.log('📄 Controllo documenti in scadenza...');
      const result = await notificationService.sendDocumentExpiryNotifications();
      console.log(`📄 Inviate ${result.sent} notifiche documenti su ${result.total}`);
    });

    // Job giornaliero per pagamenti scaduti (ogni giorno alle 10:00)
    this.scheduleJob('payment-reminders', '0 10 * * *', async () => {
      console.log('💰 Controllo pagamenti scaduti...');
      const result = await notificationService.sendPaymentReminders();
      console.log(`💰 Inviate ${result.sent} promemoria pagamenti su ${result.total}`);
    });

    // Job giornaliero per promemoria partite (ogni giorno alle 18:00)
    this.scheduleJob('match-reminders', '0 18 * * *', async () => {
      console.log('⚽ Invio promemoria partite...');
      const result = await notificationService.sendMatchReminders();
      console.log(`⚽ Inviate ${result.sent} promemoria partite su ${result.total}`);
    });

    // Job ogni 5 minuti per test in development
    if (process.env.NODE_ENV === 'development') {
      this.scheduleJob('test-notifications', '*/5 * * * *', async () => {
        console.log('🧪 Test notifiche (ogni 5 minuti in dev)');
        await this.checkAndNotifyExpringDocuments();
        await this.checkAndNotifyOverduePayments();
      });
    }

    console.log('✅ Scheduler inizializzato con', this.jobs.size, 'job');
  }

  /**
   * Schedula un nuovo job
   */
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>) {
    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`⏰ Esecuzione job: ${name}`);
        await task();
      } catch (error) {
        console.error(`❌ Errore nel job ${name}:`, error);
      }
    });

    this.jobs.set(name, job);
    job.start();
    console.log(`✅ Job schedulato: ${name} (${schedule})`);
  }

  /**
   * Controlla documenti in scadenza nei prossimi 30 giorni
   */
  async checkAndNotifyExpringDocuments() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringDocuments = await prisma.document.findMany({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          },
          status: { not: 'EXPIRED' }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      console.log(`📄 Trovati ${expiringDocuments.length} documenti in scadenza`);

      for (const doc of expiringDocuments) {
        const daysUntilExpiry = Math.ceil(
          (doc.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Invia notifica solo se è vicino alla scadenza
        if (daysUntilExpiry <= 7 || daysUntilExpiry === 14 || daysUntilExpiry === 30) {
          await notificationService.createNotification({
            userId: null, // Notifica di sistema
            organizationId: doc.organizationId,
            type: 'document_expiry',
            title: `Documento in scadenza tra ${daysUntilExpiry} giorni`,
            message: `Il documento ${doc.type.name} di ${doc.athlete.firstName} ${doc.athlete.lastName} scade il ${doc.expiryDate?.toLocaleDateString('it-IT')}`,
            priority: daysUntilExpiry <= 7 ? 'urgent' : 'high',
            link: `/athletes/${doc.athleteId}/documents`,
            data: {
              documentId: doc.id,
              athleteId: doc.athleteId,
              documentType: doc.type.name,
              expiryDate: doc.expiryDate,
              daysUntilExpiry
            }
          });
        }
      }
    } catch (error) {
      console.error('Errore controllo documenti:', error);
    }
  }

  /**
   * Controlla pagamenti scaduti
   */
  async checkAndNotifyOverduePayments() {
    try {
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      console.log(`💰 Trovati ${overduePayments.length} pagamenti scaduti`);

      for (const payment of overduePayments) {
        // Aggiorna status a OVERDUE
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'OVERDUE' }
        });

        // Crea notifica
        await notificationService.createNotification({
          userId: null,
          organizationId: payment.organizationId,
          type: 'payment_overdue',
          title: 'Pagamento scaduto',
          message: `Pagamento di €${payment.amount} per ${payment.athlete.firstName} ${payment.athlete.lastName} è scaduto`,
          priority: 'urgent',
          link: `/payments/${payment.id}`,
          data: {
            paymentId: payment.id,
            athleteId: payment.athleteId,
            amount: payment.amount,
            dueDate: payment.dueDate
          }
        });
      }
    } catch (error) {
      console.error('Errore controllo pagamenti:', error);
    }
  }

  /**
   * Esegui un job manualmente (per test)
   */
  async runJobManually(jobName: string) {
    console.log(`🔧 Esecuzione manuale job: ${jobName}`);
    
    switch (jobName) {
      case 'documents':
        await this.checkAndNotifyExpringDocuments();
        break;
      case 'payments':
        await this.checkAndNotifyOverduePayments();
        break;
      case 'all':
        await this.checkAndNotifyExpringDocuments();
        await this.checkAndNotifyOverduePayments();
        break;
      default:
        console.log('Job non riconosciuto');
    }
  }

  /**
   * Ferma tutti i job
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Job fermato: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Riavvia tutti i job
   */
  restart() {
    this.stop();
    this.initialize();
  }

  /**
   * Ottieni lo stato dei job
   */
  getStatus() {
    const status: any[] = [];
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        running: true // cron non espone lo stato direttamente
      });
    });
    return status;
  }
}

// Esporta singleton
export default new SchedulerService();
