// src/services/notificationService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class NotificationService {
  /**
   * Recupera le notifiche dell'utente
   */
  async getNotifications(filters = {}, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await axios.get(`${API_URL}/notifications?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

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
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.put(
        `${API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.post(
        `${API_URL}/notifications`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.post(
        `${API_URL}/notifications/send-bulk`,
        {
          userIds,
          ...notificationData
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.post(
        `${API_URL}/notifications/send-to-organization`,
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.post(
        `${API_URL}/notifications/send-to-team/${teamId}`,
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.get(
        `${API_URL}/notifications/templates`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.post(
        `${API_URL}/notifications/send-reminders`,
        { type },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      const response = await axios.get(
        `${API_URL}/notifications/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export default new NotificationService();