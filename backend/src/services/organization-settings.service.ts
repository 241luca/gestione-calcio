// backend/src/services/organization-settings.service.ts
import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../utils/errors';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export class OrganizationSettingsService {
  // Chiave per criptare API keys (in produzione usa KEY vault)
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

  /**
   * Cripta una stringa
   */
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decripta una stringa
   */
  private decrypt(text: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(text, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Errore decriptazione:', error);
      return '';
    }
  }

  /**
   * Recupera o crea settings per organizzazione
   */
  async getOrCreateSettings(organizationId: string) {
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId }
    });

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          organizationId,
          emailProvider: 'brevo',
          emailEnabled: false,
          defaultPreferences: {
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
          }
        }
      });
    }

    return settings;
  }

  /**
   * Recupera settings con API key decriptata
   */
  async getSettings(organizationId: string) {
    const settings = await this.getOrCreateSettings(organizationId);
    
    // Decripta API key se presente
    if (settings.emailApiKey) {
      return {
        ...settings,
        emailApiKey: this.decrypt(settings.emailApiKey)
      };
    }

    return settings;
  }

  /**
   * Salva email settings
   */
  async saveEmailSettings(organizationId: string, data: any) {
    const settings = await this.getOrCreateSettings(organizationId);
    
    // Cripta API key se fornita
    const updateData: any = {
      emailProvider: data.emailProvider || 'brevo',
      emailFrom: data.emailFrom || data.senderEmail,
      emailFromName: data.emailFromName || data.senderName,
      emailEnabled: data.emailEnabled ?? true
    };

    if (data.apiKey && data.apiKey !== '***hidden***' && data.apiKey !== '***saved***') {
      updateData.emailApiKey = this.encrypt(data.apiKey);
    }

    const updated = await prisma.organizationSettings.update({
      where: { id: settings.id },
      data: updateData
    });

    console.log(`✅ Email settings salvate per organizzazione ${organizationId}`);
    
    // Ritorna con API key nascosta
    return {
      ...updated,
      emailApiKey: updated.emailApiKey ? '***saved***' : null
    };
  }

  /**
   * Salva preferenze default
   */
  async saveDefaultPreferences(organizationId: string, preferences: any) {
    const settings = await this.getOrCreateSettings(organizationId);
    
    const updated = await prisma.organizationSettings.update({
      where: { id: settings.id },
      data: {
        defaultPreferences: preferences
      }
    });

    // Applica a tutti gli utenti esistenti
    await prisma.user.updateMany({
      where: { organizationId },
      data: {
        preferences: preferences
      }
    });

    console.log(`✅ Preferenze default salvate e applicate`);
    
    return updated;
  }

  /**
   * Recupera API key decriptata per uso interno
   */
  async getEmailApiKey(organizationId: string): Promise<string | null> {
    const settings = await this.getOrCreateSettings(organizationId);
    
    if (!settings.emailApiKey) {
      return null;
    }

    return this.decrypt(settings.emailApiKey);
  }

  /**
   * Verifica se email è abilitata
   */
  async isEmailEnabled(organizationId: string): Promise<boolean> {
    const settings = await this.getOrCreateSettings(organizationId);
    return settings.emailEnabled;
  }

  /**
   * Recupera tutte le impostazioni formattate per frontend
   */
  async getAllSettings(organizationId: string) {
    const settings = await this.getOrCreateSettings(organizationId);
    
    return {
      email: {
        provider: settings.emailProvider || 'brevo',
        apiKey: settings.emailApiKey ? '***hidden***' : '',
        senderEmail: settings.emailFrom || 'noreply@soccermanager.com',
        senderName: settings.emailFromName || 'Soccer Manager',
        enabled: settings.emailEnabled,
        testMode: false
      },
      preferences: settings.defaultPreferences || {},
      general: {
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        currency: settings.currency,
        language: settings.language
      }
    };
  }
}

// Esporta singleton
export default new OrganizationSettingsService();
