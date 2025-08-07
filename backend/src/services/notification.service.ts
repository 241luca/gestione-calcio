// backend/src/services/notification.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ResponseFormatter } from '../utils/responseFormatter';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import SocketService from './socket.service';

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
          // status: 'unread', // Rimosso - non esiste nel modello
          isRead: false
        }
      });

      // Invia notifica in tempo reale via Socket.io
      SocketService.sendNotification(data.userId, notification);
      
      // Aggiorna anche il contatore
      const unreadCount = await this.getUnreadCount(data.userId);
      SocketService.sendNotificationCount(data.userId, unreadCount);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new BadRequestError('Errore nella creazione della notifica');
    }
  }

  /**
   * Crea notifiche per più utenti
   */
  async createBulkNotifications(userIds: string[], notificationData: {
    organizationId: string;
    type: string;
    title: string;
    message: string;
    priority?: NotificationPriority;
    link?: string;
    data?: any;
  }) {
    try {
      const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          organizationId: notificationData.organizationId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || 'normal',
          link: notificationData.link,
          data: notificationData.data || {},
          status: 'unread',
          isRead: false
        }))
      });

      // Invia notifiche via Socket.io a tutti gli utenti
      for (const userId of userIds) {
        const notification = {
          userId,
          organizationId: notificationData.organizationId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || 'normal',
          link: notificationData.link,
          data: notificationData.data || {},
          createdAt: new Date()
        };
        
        SocketService.sendNotification(userId, notification);
        
        // Aggiorna contatore
        const unreadCount = await this.getUnreadCount(userId);
        SocketService.sendNotificationCount(userId, unreadCount);
      }

      return {
        created: notifications.count,
        userIds
      };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw new BadRequestError('Errore nella creazione delle notifiche');
    }
  }

  /**
   * Notifica tutti gli utenti di un'organizzazione
   */
  async notifyOrganization(organizationId: string, notificationData: {
    type: string;
    title: string;
    message: string;
    priority?: NotificationPriority;
    link?: string;
    data?: any;
  }) {
    try {
      // Trova tutti gli utenti dell'organizzazione
      const users = await prisma.user.findMany({
        where: {
          userOrganizations: {
            some: {
              organizationId
            }
          }
        },
        select: { id: true }
      });

      const userIds = users.map(u => u.id);

      return await this.createBulkNotifications(userIds, {
        ...notificationData,
        organizationId
      });
    } catch (error) {
      console.error('Error notifying organization:', error);
      throw new BadRequestError('Errore nell\'invio notifiche all\'organizzazione');
    }
  }

  /**
   * Notifica tutti i membri di un team
   */
  async notifyTeam(teamId: string, notificationData: {
    organizationId: string;
    type: string;
    title: string;
    message: string;
    priority?: NotificationPriority;
    link?: string;
    data?: any;
  }) {
    try {
      // Trova tutti gli atleti del team
      const athletes = await prisma.athlete.findMany({
        where: { teamId },
        select: { 
          id: true,
          firstName: true,
          lastName: true
        }
      });

      // Trova i genitori/tutori degli atleti
      const parentEmails = athletes
        .map(a => a.id) // In un sistema reale, qui dovremmo cercare i genitori associati
        .filter(Boolean);

      // Per ora creiamo notifiche per gli staff del team
      const staff = await prisma.user.findMany({
        where: {
          userOrganizations: {
            some: {
              organizationId: notificationData.organizationId
            }
          }
        },
        select: { id: true }
      });

      const userIds = staff.map(s => s.id);

      return await this.createBulkNotifications(userIds, notificationData);
    } catch (error) {
      console.error('Error notifying team:', error);
      throw new BadRequestError('Errore nell\'invio notifiche al team');
    }
  }

  /**
   * Recupera le notifiche di un utente
   */
  async getUserNotifications(
    userId: string,
    filters?: {
      status?: NotificationStatus;
      priority?: NotificationPriority;
      type?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.priority) {
        where.priority = filters.priority;
      }
      if (filters?.type) {
        where.type = filters.type;
      }
      if (filters?.fromDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: startOfDay(filters.fromDate)
        };
      }
      if (filters?.toDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: endOfDay(filters.toDate)
        };
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.notification.count({ where })
      ]);

      // Conta le non lette
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          status: 'unread'
        }
      });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new BadRequestError('Errore nel recupero delle notifiche');
    }
  }

  /**
   * Segna una notifica come letta
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new NotFoundError('Notifica non trovata');
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'read',
          isRead: true,
          readAt: new Date()
        }
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error('Error marking notification as read:', error);
      throw new BadRequestError('Errore nell\'aggiornamento della notifica');
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
          status: 'unread'
        },
        data: {
          status: 'read',
          isRead: true,
          readAt: new Date()
        }
      });

      return {
        updated: result.count
      };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw new BadRequestError('Errore nell\'aggiornamento delle notifiche');
    }
  }

  /**
   * Elimina una notifica
   */
  async deleteNotification(id: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!notification) {
        throw new NotFoundError('Notifica non trovata');
      }

      await prisma.notification.delete({
        where: { id }
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error('Error deleting notification:', error);
      throw new BadRequestError('Errore nell\'eliminazione della notifica');
    }
  }

  /**
   * Invia notifiche per documenti in scadenza
   */
  async sendDocumentExpiryNotifications() {
    try {
      // Trova documenti che scadono nei prossimi 30 giorni
      const expiringDocuments = await prisma.document.findMany({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: addDays(new Date(), 30)
          },
          status: { not: 'EXPIRED' }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      const notifications = [];

      for (const doc of expiringDocuments) {
        const daysUntilExpiry = Math.ceil(
          (doc.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        let priority: NotificationPriority = 'normal';
        if (daysUntilExpiry <= 7) priority = 'urgent';
        else if (daysUntilExpiry <= 14) priority = 'high';

        // Trova utenti da notificare (admin e staff)
        const users = await prisma.user.findMany({
          where: {
            userOrganizations: {
              some: {
                organizationId: doc.organizationId,
                role: {
                  permissions: {
                    some: {
                      permission: {
                        resource: 'documents',
                        action: { in: ['read', 'write', 'admin'] }
                      }
                    }
                  }
                }
              }
            }
          },
          select: { id: true }
        });

        for (const user of users) {
          notifications.push(
            this.createNotification({
              userId: user.id,
              organizationId: doc.organizationId,
              type: 'document_expiry',
              title: `Documento in scadenza: ${doc.type.name}`,
              message: `Il documento ${doc.type.name} di ${doc.athlete.firstName} ${doc.athlete.lastName} scade tra ${daysUntilExpiry} giorni`,
              priority,
              link: `/athletes/${doc.athleteId}/documents`,
              data: {
                documentId: doc.id,
                athleteId: doc.athleteId,
                daysUntilExpiry
              }
            })
          );
        }
      }

      await Promise.all(notifications);

      return {
        documentsChecked: expiringDocuments.length,
        notificationsSent: notifications.length
      };
    } catch (error) {
      console.error('Error sending document expiry notifications:', error);
      throw new BadRequestError('Errore nell\'invio notifiche scadenza documenti');
    }
  }

  /**
   * Invia promemoria pagamenti
   */
  async sendPaymentReminders() {
    try {
      // Trova pagamenti in scadenza o scaduti
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: {
            lte: addDays(new Date(), 7)
          }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      const notifications = [];

      for (const payment of overduePayments) {
        const isOverdue = payment.dueDate < new Date();
        const priority: NotificationPriority = isOverdue ? 'urgent' : 'high';

        // Trova utenti da notificare
        const users = await prisma.user.findMany({
          where: {
            userOrganizations: {
              some: {
                organizationId: payment.organizationId,
                role: {
                  permissions: {
                    some: {
                      permission: {
                        resource: 'payments',
                        action: { in: ['read', 'write', 'admin'] }
                      }
                    }
                  }
                }
              }
            }
          },
          select: { id: true }
        });

        for (const user of users) {
          notifications.push(
            this.createNotification({
              userId: user.id,
              organizationId: payment.organizationId,
              type: 'payment_reminder',
              title: isOverdue ? 'Pagamento scaduto' : 'Pagamento in scadenza',
              message: `${payment.type.name} di ${payment.athlete.firstName} ${payment.athlete.lastName} - €${payment.amount}`,
              priority,
              link: `/payments?athleteId=${payment.athleteId}`,
              data: {
                paymentId: payment.id,
                athleteId: payment.athleteId,
                amount: payment.amount,
                isOverdue
              }
            })
          );
        }
      }

      await Promise.all(notifications);

      return {
        paymentsChecked: overduePayments.length,
        notificationsSent: notifications.length
      };
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      throw new BadRequestError('Errore nell\'invio promemoria pagamenti');
    }
  }

  /**
   * Invia promemoria partite
   */
  async sendMatchReminders() {
    try {
      // Trova partite nei prossimi 2 giorni
      const upcomingMatches = await prisma.match.findMany({
        where: {
          date: {
            gte: new Date(),
            lte: addDays(new Date(), 2)
          }
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          competition: true,
          venue: true
        }
      });

      const notifications = [];

      for (const match of upcomingMatches) {
        // Trova gli atleti convocati
        const roster = await prisma.matchRoster.findMany({
          where: { matchId: match.id },
          include: { athlete: true }
        });

        // Notifica staff del team
        const users = await prisma.user.findMany({
          where: {
            userOrganizations: {
              some: {
                organizationId: match.organizationId
              }
            }
          },
          select: { id: true }
        });

        for (const user of users) {
          notifications.push(
            this.createNotification({
              userId: user.id,
              organizationId: match.organizationId,
              type: 'match_reminder',
              title: 'Promemoria partita',
              message: `${match.homeTeam.name} vs ${match.awayTeam?.name || 'TBD'} - ${match.date.toLocaleDateString()}`,
              priority: 'normal',
              link: `/matches/${match.id}`,
              data: {
                matchId: match.id,
                venue: match.venue?.name,
                date: match.date
              }
            })
          );
        }
      }

      await Promise.all(notifications);

      return {
        matchesChecked: upcomingMatches.length,
        notificationsSent: notifications.length
      };
    } catch (error) {
      console.error('Error sending match reminders:', error);
      throw new BadRequestError('Errore nell\'invio promemoria partite');
    }
  }

  /**
   * Invia promemoria allenamenti
   */
  async sendTrainingReminders() {
    try {
      // Trova allenamenti di domani
      const tomorrow = addDays(new Date(), 1);
      const trainingSessions = await prisma.trainingSession.findMany({
        where: {
          date: {
            gte: startOfDay(tomorrow),
            lte: endOfDay(tomorrow)
          }
        },
        include: {
          team: true
        }
      });

      const notifications = [];

      for (const session of trainingSessions) {
        // Trova utenti del team
        const users = await prisma.user.findMany({
          where: {
            userOrganizations: {
              some: {
                organizationId: session.organizationId
              }
            }
          },
          select: { id: true }
        });

        for (const user of users) {
          notifications.push(
            this.createNotification({
              userId: user.id,
              organizationId: session.organizationId,
              type: 'training_reminder',
              title: 'Promemoria allenamento',
              message: `Allenamento ${session.team.name} - ${session.date.toLocaleDateString()} alle ${session.date.toLocaleTimeString()}`,
              priority: 'normal',
              link: `/training/${session.id}`,
              data: {
                sessionId: session.id,
                teamId: session.teamId,
                date: session.date
              }
            })
          );
        }
      }

      await Promise.all(notifications);

      return {
        sessionsChecked: trainingSessions.length,
        notificationsSent: notifications.length
      };
    } catch (error) {
      console.error('Error sending training reminders:', error);
      throw new BadRequestError('Errore nell\'invio promemoria allenamenti');
    }
  }

  /**
   * Recupera i template di notifica
   */
  async getNotificationTemplates() {
    // Template predefiniti (in produzione sarebbero nel database)
    return [
      {
        id: 'document_expiry',
        name: 'Documento in scadenza',
        title: 'Documento in scadenza: {{documentType}}',
        message: 'Il documento {{documentType}} di {{athleteName}} scade tra {{days}} giorni',
        priority: 'high',
        variables: ['documentType', 'athleteName', 'days']
      },
      {
        id: 'payment_overdue',
        name: 'Pagamento scaduto',
        title: 'Pagamento scaduto',
        message: 'Il pagamento {{paymentType}} di {{athleteName}} è scaduto. Importo: €{{amount}}',
        priority: 'urgent',
        variables: ['paymentType', 'athleteName', 'amount']
      },
      {
        id: 'match_convocation',
        name: 'Convocazione partita',
        title: 'Convocazione partita',
        message: 'Sei stato convocato per la partita {{match}} del {{date}}',
        priority: 'normal',
        variables: ['match', 'date']
      },
      {
        id: 'transport_booking_confirmed',
        name: 'Prenotazione trasporto confermata',
        title: 'Trasporto confermato',
        message: 'La tua prenotazione per il trasporto del {{date}} è stata confermata',
        priority: 'normal',
        variables: ['date']
      }
    ];
  }

  /**
   * Crea un template personalizzato
   */
  async createCustomTemplate(template: {
    name: string;
    title: string;
    message: string;
    priority: NotificationPriority;
    variables?: string[];
  }) {
    // In produzione, salveremmo nel database
    // Per ora restituiamo solo una conferma
    return {
      ...template,
      id: `custom_${Date.now()}`,
      createdAt: new Date()
    };
  }

  /**
   * Conta le notifiche non lette di un utente
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          status: 'unread'
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
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
          where: {
            organizationId,
            status: 'unread'
          }
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
        byType: byType.map(t => ({
          type: t.type,
          count: t._count
        })),
        byPriority: byPriority.map(p => ({
          priority: p.priority,
          count: p._count
        }))
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new BadRequestError('Errore nel recupero statistiche notifiche');
    }
  }
}