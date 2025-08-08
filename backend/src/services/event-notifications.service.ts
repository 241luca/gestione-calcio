// backend/src/services/event-notifications.service.ts
import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';
import SocketService from './socket.service';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

/**
 * Servizio per gestire notifiche automatiche su eventi
 */
export class EventNotificationService {
  
  /**
   * Notifica quando viene registrato un nuovo atleta
   */
  async notifyNewAthlete(athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null, // Notifica a tutti
        organizationId,
        type: 'athlete_new',
        title: 'Nuovo atleta registrato',
        message: `${athlete.firstName} ${athlete.lastName} è stato aggiunto al sistema`,
        priority: 'normal',
        link: `/athletes/${athlete.id}`,
        data: {
          athleteId: athlete.id,
          athleteName: `${athlete.firstName} ${athlete.lastName}`
        }
      });
    } catch (error) {
      console.error('Errore invio notifica nuovo atleta:', error);
    }
  }

  /**
   * Notifica quando un documento viene caricato
   */
  async notifyDocumentUploaded(document: any, athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'document_uploaded',
        title: 'Nuovo documento caricato',
        message: `Documento ${document.type.name} caricato per ${athlete.firstName} ${athlete.lastName}`,
        priority: 'normal',
        link: `/athletes/${athlete.id}/documents`,
        data: {
          documentId: document.id,
          athleteId: athlete.id,
          documentType: document.type.name
        }
      });
    } catch (error) {
      console.error('Errore invio notifica documento:', error);
    }
  }

  /**
   * Notifica quando un documento viene verificato
   */
  async notifyDocumentVerified(document: any, athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'document_verified',
        title: 'Documento verificato',
        message: `Documento ${document.type.name} di ${athlete.firstName} ${athlete.lastName} verificato`,
        priority: 'normal',
        link: `/athletes/${athlete.id}/documents`,
        data: {
          documentId: document.id,
          athleteId: athlete.id
        }
      });
    } catch (error) {
      console.error('Errore invio notifica verifica:', error);
    }
  }

  /**
   * Notifica quando viene ricevuto un pagamento
   */
  async notifyPaymentReceived(payment: any, athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'payment_received',
        title: 'Pagamento ricevuto',
        message: `Ricevuto pagamento di €${payment.amount} da ${athlete.firstName} ${athlete.lastName}`,
        priority: 'normal',
        link: `/payments/${payment.id}`,
        data: {
          paymentId: payment.id,
          athleteId: athlete.id,
          amount: payment.amount
        }
      });
    } catch (error) {
      console.error('Errore invio notifica pagamento:', error);
    }
  }

  /**
   * Notifica convocazione per partita
   */
  async notifyMatchConvocation(match: any, athletes: any[], organizationId: string) {
    try {
      const matchDate = new Date(match.date).toLocaleDateString('it-IT');
      
      // Notifica generale
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'match_convocation',
        title: 'Nuova convocazione partita',
        message: `Convocazioni pubblicate per la partita del ${matchDate}`,
        priority: 'high',
        link: `/matches/${match.id}`,
        data: {
          matchId: match.id,
          date: match.date,
          athletesCount: athletes.length
        }
      });

      // Notifiche individuali per ogni atleta convocato (se implementato sistema utenti-atleti)
      // for (const athlete of athletes) {
      //   if (athlete.userId) {
      //     await notificationService.createNotification({
      //       userId: athlete.userId,
      //       organizationId,
      //       type: 'match_convocation_personal',
      //       title: 'Sei stato convocato!',
      //       message: `Sei stato convocato per la partita del ${matchDate}`,
      //       priority: 'urgent',
      //       link: `/matches/${match.id}`,
      //       data: { matchId: match.id }
      //     });
      //   }
      // }
    } catch (error) {
      console.error('Errore invio notifica convocazione:', error);
    }
  }

  /**
   * Notifica registrazione infortunio
   */
  async notifyInjuryRegistered(injury: any, athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'injury_registered',
        title: 'Infortunio registrato',
        message: `Registrato infortunio per ${athlete.firstName} ${athlete.lastName}: ${injury.description}`,
        priority: 'high',
        link: `/athletes/${athlete.id}`,
        data: {
          injuryId: injury.id,
          athleteId: athlete.id,
          severity: injury.severity
        }
      });
    } catch (error) {
      console.error('Errore invio notifica infortunio:', error);
    }
  }

  /**
   * Notifica quando un atleta recupera da infortunio
   */
  async notifyInjuryRecovered(injury: any, athlete: any, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'injury_recovered',
        title: 'Atleta recuperato',
        message: `${athlete.firstName} ${athlete.lastName} è recuperato dall'infortunio`,
        priority: 'normal',
        link: `/athletes/${athlete.id}`,
        data: {
          injuryId: injury.id,
          athleteId: athlete.id
        }
      });
    } catch (error) {
      console.error('Errore invio notifica recupero:', error);
    }
  }

  /**
   * Notifica modifica roster squadra
   */
  async notifyRosterChange(team: any, change: string, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'roster_change',
        title: 'Modifica roster squadra',
        message: `${change} nella squadra ${team.name}`,
        priority: 'normal',
        link: `/teams/${team.id}`,
        data: {
          teamId: team.id,
          teamName: team.name,
          change
        }
      });
    } catch (error) {
      console.error('Errore invio notifica roster:', error);
    }
  }

  /**
   * Notifica allenamento annullato
   */
  async notifyTrainingCancelled(session: any, reason: string, organizationId: string) {
    try {
      const sessionDate = new Date(session.date).toLocaleDateString('it-IT');
      
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'training_cancelled',
        title: 'Allenamento annullato',
        message: `Allenamento del ${sessionDate} annullato: ${reason}`,
        priority: 'urgent',
        link: '/calendar',
        data: {
          sessionId: session.id,
          date: session.date,
          reason
        }
      });
    } catch (error) {
      console.error('Errore invio notifica allenamento:', error);
    }
  }

  /**
   * Notifica cambio orario allenamento
   */
  async notifyTrainingRescheduled(session: any, oldDate: Date, newDate: Date, organizationId: string) {
    try {
      await notificationService.createNotification({
        userId: null,
        organizationId,
        type: 'training_rescheduled',
        title: 'Allenamento riprogrammato',
        message: `Allenamento spostato dal ${oldDate.toLocaleDateString('it-IT')} al ${newDate.toLocaleDateString('it-IT')}`,
        priority: 'high',
        link: '/calendar',
        data: {
          sessionId: session.id,
          oldDate,
          newDate
        }
      });
    } catch (error) {
      console.error('Errore invio notifica riprogrammazione:', error);
    }
  }
}

// Esporta singleton
export default new EventNotificationService();
