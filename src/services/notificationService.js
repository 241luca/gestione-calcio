// src/services/notificationService.js
import api from './api';

class NotificationService {
  /**
   * Recupera le notifiche dell'utente
   */
  async getNotifications(filters = {}, page = 1, limit = 20) {
    try {
      const params = {
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      };

      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Segna una notifica come letta
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`, {});
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Segna tutte le notifiche come lette
   */
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/mark-all-read', {});
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Elimina una notifica
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Crea una nuova notifica
   */
  async createNotification(data) {
    try {
      const response = await api.post('/notifications', data);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Invia notifiche bulk
   */
  async sendBulkNotifications(userIds, notificationData) {
    try {
      const response = await api.post('/notifications/send-bulk', {
        userIds,
        ...notificationData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Invia notifica all'organizzazione
   */
  async sendToOrganization(notificationData) {
    try {
      const response = await api.post('/notifications/send-to-organization', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending to organization:', error);
      throw error;
    }
  }

  /**
   * Invia notifica a un team
   */
  async sendToTeam(teamId, notificationData) {
    try {
      const response = await api.post(`/notifications/send-to-team/${teamId}`, notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending to team:', error);
      throw error;
    }
  }

  /**
   * Recupera i template di notifica
   */
  async getTemplates() {
    try {
      const response = await api.get('/notifications/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Invia promemoria
   */
  async sendReminders(type = 'all') {
    try {
      const response = await api.post('/notifications/send-reminders', { type });
      return response.data;
    } catch (error) {
      console.error('Error sending reminders:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche notifiche
   */
  async getStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export default new NotificationService();
