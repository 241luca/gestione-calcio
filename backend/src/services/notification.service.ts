// backend/src/services/notification.service.ts - VERSIONE CORRETTA FINALE
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Crea una nuova notifica per un utente
   */
  async createNotification(data: {
    userId: string | null;
    organizationId: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
    link?: string;
    data?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority || 'normal',
          link: data.link,
          data: data.data || {},
          isRead: false
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new BadRequestError('Errore nella creazione della notifica');
    }
  }

  /**
   * Recupera le notifiche di un utente con filtri
   */
  async getUserNotifications(
    userId: string,
    filters: any = {},
    pagination: { page: number; limit: number }
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const where: any = {
        userId,
        ...(filters.status && { isRead: filters.status === 'read' }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.type && { type: filters.type }),
        ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
        ...(filters.toDate && { createdAt: { lte: filters.toDate } })
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new BadRequestError('Errore nel recupero delle notifiche');
    }
  }

  /**
   * Conta le notifiche non lette
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Segna una notifica come letta
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new NotFoundError('Notifica non trovata');
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          isRead: true,
          readAt: new Date()
        }
      });

      return updated;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Segna tutte le notifiche come lette
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { updated: result.count };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw new BadRequestError('Errore nell\'aggiornamento delle notifiche');
    }
  }

  /**
   * Elimina una notifica
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new NotFoundError('Notifica non trovata');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Crea notifiche in bulk
   */
  async createBulkNotifications(userIds: string[], data: any) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        organizationId: data.organizationId,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        link: data.link,
        data: data.data || {},
        isRead: false
      }));

      const result = await prisma.notification.createMany({
        data: notifications
      });

      return { created: result.count };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw new BadRequestError('Errore nella creazione delle notifiche');
    }
  }

  /**
   * Notifica tutta l'organizzazione
   */
  async notifyOrganization(organizationId: string, data: any) {
    try {
      // Trova tutti gli utenti dell'organizzazione
      const users = await prisma.user.findMany({
        where: {
          organizationId: organizationId
        },
        select: { 
          id: true 
        }
      });

      const userIds = users.map((u: { id: string }) => u.id);
      
      if (userIds.length === 0) {
        return { created: 0 };
      }
      
      return await this.createBulkNotifications(userIds, {
        ...data,
        organizationId
      });
    } catch (error) {
      console.error('Error notifying organization:', error);
      throw new BadRequestError('Errore nell\'invio delle notifiche');
    }
  }

  /**
   * Notifica un team
   */
  async notifyTeam(teamId: string, data: any) {
    try {
      // Trova gli atleti del team
      const athletes = await prisma.athlete.findMany({
        where: { teamId },
        select: { id: true }
      });

      // Per ora creiamo notifiche generiche per il team
      // In futuro si potrebbero notificare anche gli allenatori
      const notification = await this.createNotification({
        userId: null, // Notifica di sistema
        organizationId: data.organizationId,
        type: 'team',
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        link: `/teams/${teamId}`,
        data: { teamId, ...data.data }
      });

      return { created: 1, notification };
    } catch (error) {
      console.error('Error notifying team:', error);
      throw new BadRequestError('Errore nell\'invio della notifica al team');
    }
  }

  /**
   * Recupera i template di notifica
   */
  async getNotificationTemplates() {
    // Template predefiniti (in futuro potrebbero venire dal database)
    return [
      {
        id: 1,
        name: 'Documento in scadenza',
        type: 'document_expiry',
        title: 'Documento in scadenza',
        message: 'Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}'
      },
      {
        id: 2,
        name: 'Pagamento scaduto',
        type: 'payment_overdue',
        title: 'Pagamento scaduto',
        message: 'Il pagamento di {{amount}}€ per {{athleteName}} è scaduto'
      },
      {
        id: 3,
        name: 'Convocazione partita',
        type: 'match_roster',
        title: 'Convocazione partita',
        message: 'Sei stato convocato per la partita del {{matchDate}}'
      },
      {
        id: 4,
        name: 'Allenamento annullato',
        type: 'training_cancelled',
        title: 'Allenamento annullato',
        message: 'L\'allenamento del {{date}} è stato annullato'
      }
    ];
  }

  /**
   * Crea un template personalizzato
   */
  async createCustomTemplate(data: any) {
    // In futuro salveremo nel database
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    };
  }

  /**
   * Invia promemoria documenti in scadenza
   */
  async sendDocumentExpiryNotifications() {
    try {
      const thirtyDaysFromNow = addDays(new Date(), 30);
      
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

      let notificationsSent = 0;

      for (const doc of expiringDocuments) {
        await this.createNotification({
          userId: null, // Notifica di sistema
          organizationId: doc.organizationId,
          type: 'document_expiry',
          title: 'Documento in scadenza',
          message: `Il documento ${doc.type.name} di ${doc.athlete.firstName} ${doc.athlete.lastName} scade il ${doc.expiryDate?.toLocaleDateString()}`,
          priority: 'high',
          link: `/athletes/${doc.athleteId}/documents`,
          data: {
            documentId: doc.id,
            athleteId: doc.athleteId,
            documentType: doc.type.name,
            expiryDate: doc.expiryDate
          }
        });
        notificationsSent++;
      }

      return { sent: notificationsSent, total: expiringDocuments.length };
    } catch (error) {
      console.error('Error sending document expiry notifications:', error);
      return { sent: 0, total: 0, error: error };
    }
  }

  /**
   * Invia promemoria pagamenti
   */
  async sendPaymentReminders() {
    try {
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: 'OVERDUE',
          reminderSent: false
        },
        include: {
          athlete: true,
          type: true
        }
      });

      let remindersSent = 0;

      for (const payment of overduePayments) {
        await this.createNotification({
          userId: null,
          organizationId: payment.organizationId,
          type: 'payment_overdue',
          title: 'Pagamento scaduto',
          message: `Pagamento di €${payment.amount} per ${payment.athlete.firstName} ${payment.athlete.lastName} scaduto`,
          priority: 'urgent',
          link: `/payments/${payment.id}`,
          data: {
            paymentId: payment.id,
            athleteId: payment.athleteId,
            amount: payment.amount
          }
        });

        // Aggiorna flag reminder
        await prisma.payment.update({
          where: { id: payment.id },
          data: { reminderSent: true }
        });

        remindersSent++;
      }

      return { sent: remindersSent, total: overduePayments.length };
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      return { sent: 0, total: 0, error: error };
    }
  }

  /**
   * Invia promemoria partite - VERSIONE SEMPLIFICATA
   */
  async sendMatchReminders() {
    try {
      const tomorrow = addDays(new Date(), 1);
      const dayAfterTomorrow = addDays(new Date(), 2);

      // Query semplificata senza include delle relazioni
      const upcomingMatches = await prisma.match.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          }
        }
      });

      let remindersSent = 0;

      for (const match of upcomingMatches) {
        // Recupera i team separatamente se necessario
        const homeTeam = await prisma.team.findUnique({
          where: { id: match.homeTeamId }
        });

        const awayTeam = await prisma.team.findUnique({
          where: { id: match.awayTeamId }
        });

        await this.createNotification({
          userId: null,
          organizationId: match.organizationId,
          type: 'match_reminder',
          title: 'Partita domani',
          message: `Partita ${homeTeam?.name || 'TBD'} vs ${awayTeam?.name || 'TBD'} domani alle ${match.time}`,
          priority: 'high',
          link: `/matches/${match.id}`,
          data: {
            matchId: match.id,
            date: match.date,
            time: match.time,
            venue: match.venue
          }
        });
        remindersSent++;
      }

      return { sent: remindersSent, total: upcomingMatches.length };
    } catch (error) {
      console.error('Error sending match reminders:', error);
      return { sent: 0, total: 0, error: error };
    }
  }

  /**
   * Invia promemoria allenamenti
   */
  async sendTrainingReminders() {
    // Implementazione base
    return { sent: 0, total: 0 };
  }

  /**
   * Statistiche notifiche
   */
  async getNotificationStats(organizationId: string) {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({
          where: { organizationId }
        }),
        prisma.notification.count({
          where: { organizationId, isRead: false }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { organizationId },
          _count: true
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { organizationId },
          _count: true
        })
      ]);

      return {
        total,
        unread,
        read: total - unread,
        byType: byType.map(t => ({ type: t.type, count: t._count })),
        byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count }))
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new BadRequestError('Errore nel recupero delle statistiche');
    }
  }
}
