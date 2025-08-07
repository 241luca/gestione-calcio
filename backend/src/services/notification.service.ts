// backend/src/services/notification.service.ts - VERSIONE SEMPLIFICATA
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
          isRead: false
        }
      });

      // Invia notifica in tempo reale via Socket.io (solo se userId non è null)
      if (data.userId) {
        SocketService.sendNotification(data.userId, notification);
        
        // Aggiorna anche il contatore
        const unreadCount = await this.getUnreadCount(data.userId);
        SocketService.sendNotificationCount(data.userId, unreadCount);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new BadRequestError('Errore nella creazione della notifica');
    }
  }

  /**
   * Recupera tutte le notifiche di un utente
   */
  async getNotificationsByUser(userId: string, organizationId: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          organizationId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });

      return notifications;
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
          isRead: true,
          readAt: new Date()
        }
      });

      // Aggiorna contatore via Socket.io
      const unreadCount = await this.getUnreadCount(userId);
      SocketService.sendNotificationCount(userId, unreadCount);

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
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Aggiorna contatore via Socket.io
      SocketService.sendNotificationCount(userId, 0);

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw new BadRequestError('Errore nel marcare le notifiche come lette');
    }
  }

  /**
   * Elimina una notifica
   */
  async deleteNotification(notificationId: string, userId: string) {
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

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      // Aggiorna contatore
      const unreadCount = await this.getUnreadCount(userId);
      SocketService.sendNotificationCount(userId, unreadCount);

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Invia notifica di documento in scadenza
   */
  async sendDocumentExpiryNotification(
    athleteId: string, 
    documentName: string, 
    daysUntilExpiry: number,
    organizationId: string
  ) {
    const priority = daysUntilExpiry <= 7 ? 'high' : 'normal';
    
    await this.createNotification({
      userId: null, // Per ora null
      organizationId,
      type: 'DOCUMENT_EXPIRY',
      title: 'Documento in scadenza',
      message: `Il documento ${documentName} scade tra ${daysUntilExpiry} giorni`,
      priority,
      link: `/athletes/${athleteId}/documents`,
      data: { athleteId, documentName, daysUntilExpiry }
    });
  }

  /**
   * Invia notifica di pagamento in scadenza
   */
  async sendPaymentReminderNotification(
    athleteId: string,
    amount: number,
    dueDate: Date,
    organizationId: string
  ) {
    await this.createNotification({
      userId: null, // Per ora null
      organizationId,
      type: 'PAYMENT_REMINDER',
      title: 'Pagamento in scadenza',
      message: `Pagamento di €${amount} in scadenza il ${dueDate.toLocaleDateString()}`,
      priority: 'normal',
      link: `/payments`,
      data: { athleteId, amount, dueDate }
    });
  }
}

export default NotificationService;
