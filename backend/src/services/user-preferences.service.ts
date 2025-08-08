// backend/src/services/user-preferences.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

interface NotificationPreferences {
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  notificationTypes: {
    documents: boolean;
    payments: boolean;
    matches: boolean;
    training: boolean;
    roster: boolean;
    injuries: boolean;
    general: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export class UserPreferencesService {
  /**
   * Recupera preferenze utente
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Cerca preferenze esistenti nel database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Utente non trovato');
      }

      // Se non ci sono preferenze salvate, ritorna quelle di default
      const preferences = user.preferences as any || this.getDefaultPreferences();
      
      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Aggiorna preferenze utente
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Recupera preferenze attuali
      const currentPrefs = await this.getUserPreferences(userId);
      
      // Merge con le nuove preferenze
      const updatedPrefs = {
        ...currentPrefs,
        ...preferences,
        notificationTypes: {
          ...currentPrefs.notificationTypes,
          ...(preferences.notificationTypes || {})
        },
        quietHours: {
          ...currentPrefs.quietHours,
          ...(preferences.quietHours || {})
        }
      };

      // Salva nel database
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: updatedPrefs as any
        }
      });

      console.log(`✅ Preferenze aggiornate per utente ${userId}`);
      return updatedPrefs;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new BadRequestError('Errore aggiornamento preferenze');
    }
  }

  /**
   * Verifica se un tipo di notifica è abilitato per l'utente
   */
  async isNotificationTypeEnabled(
    userId: string,
    notificationType: keyof NotificationPreferences['notificationTypes']
  ): Promise<boolean> {
    try {
      const prefs = await this.getUserPreferences(userId);
      return prefs.notificationTypes[notificationType] ?? true;
    } catch (error) {
      return true; // Default: abilitate
    }
  }

  /**
   * Verifica se è possibile inviare notifiche in questo momento
   */
  async canSendNotificationNow(userId: string): Promise<boolean> {
    try {
      const prefs = await this.getUserPreferences(userId);
      
      if (!prefs.quietHours.enabled) {
        return true;
      }

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const { start, end } = prefs.quietHours;
      
      // Gestisce il caso in cui le ore quiet attraversano la mezzanotte
      if (start > end) {
        // Es: 22:00 - 08:00
        return currentTime < start && currentTime >= end;
      } else {
        // Es: 08:00 - 22:00
        return currentTime < start || currentTime >= end;
      }
    } catch (error) {
      return true; // Default: può inviare
    }
  }

  /**
   * Recupera utenti che devono ricevere il digest
   */
  async getUsersForDigest(
    organizationId: string,
    frequency: 'daily' | 'weekly'
  ): Promise<string[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          organizationId,
          isActive: true
        }
      });

      const eligibleUsers: string[] = [];

      for (const user of users) {
        const prefs = await this.getUserPreferences(user.id);
        
        if (prefs.emailEnabled && prefs.emailFrequency === frequency) {
          eligibleUsers.push(user.id);
        }
      }

      return eligibleUsers;
    } catch (error) {
      console.error('Error getting users for digest:', error);
      return [];
    }
  }

  /**
   * Resetta preferenze ai valori di default
   */
  async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    const defaults = this.getDefaultPreferences();
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: defaults as any
      }
    });

    return defaults;
  }

  /**
   * Preferenze di default
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      emailEnabled: true,
      emailFrequency: 'instant',
      notificationTypes: {
        documents: true,
        payments: true,
        matches: true,
        training: true,
        roster: true,
        injuries: true,
        general: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Applica preferenze globali organizzazione
   */
  async applyOrganizationDefaults(
    organizationId: string,
    defaults: Partial<NotificationPreferences>
  ) {
    try {
      const users = await prisma.user.findMany({
        where: { organizationId }
      });

      for (const user of users) {
        await this.updateUserPreferences(user.id, defaults);
      }

      console.log(`✅ Applicate preferenze di default a ${users.length} utenti`);
      return { updated: users.length };
    } catch (error) {
      console.error('Error applying organization defaults:', error);
      throw new BadRequestError('Errore applicazione preferenze organizzazione');
    }
  }
}

// Esporta singleton
export default new UserPreferencesService();
