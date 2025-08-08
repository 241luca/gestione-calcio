// backend/src/services/notification-templates.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

interface NotificationTemplate {
  id?: string;
  name: string;
  type: string;
  title: string;
  message: string;
  emailSubject?: string;
  emailBody?: string;
  variables: string[]; // es: ['athleteName', 'documentType', 'expiryDate']
  isActive: boolean;
  organizationId?: string;
  isSystem: boolean; // true = template di sistema, false = personalizzato
}

export class NotificationTemplatesService {
  private systemTemplates: NotificationTemplate[] = [
    {
      name: 'Documento in scadenza',
      type: 'document_expiry',
      title: 'Documento in scadenza',
      message: 'Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}',
      emailSubject: '[{{urgency}}] Documento in scadenza - {{athleteName}}',
      emailBody: 'Il documento {{documentType}} dell\'atleta {{athleteName}} scadrà il {{expiryDate}}. Si prega di provvedere al rinnovo.',
      variables: ['documentType', 'athleteName', 'expiryDate', 'urgency', 'daysUntilExpiry'],
      isActive: true,
      isSystem: true
    },
    {
      name: 'Pagamento scaduto',
      type: 'payment_overdue',
      title: 'Pagamento scaduto',
      message: 'Il pagamento di €{{amount}} per {{athleteName}} è scaduto',
      emailSubject: '[URGENTE] Pagamento scaduto - {{athleteName}}',
      emailBody: 'Il pagamento di €{{amount}} per l\'atleta {{athleteName}} risulta scaduto dal {{dueDate}}.',
      variables: ['amount', 'athleteName', 'dueDate'],
      isActive: true,
      isSystem: true
    },
    {
      name: 'Convocazione partita',
      type: 'match_convocation',
      title: 'Convocazione partita',
      message: 'Sei stato convocato per la partita del {{matchDate}} contro {{opponent}}',
      emailSubject: 'Convocazione partita - {{matchDate}}',
      emailBody: 'Sei stato convocato per la partita del {{matchDate}} contro {{opponent}}. Ritrovo ore {{meetingTime}} presso {{venue}}.',
      variables: ['matchDate', 'opponent', 'meetingTime', 'venue'],
      isActive: true,
      isSystem: true
    },
    {
      name: 'Nuovo atleta registrato',
      type: 'athlete_new',
      title: 'Nuovo atleta registrato',
      message: '{{athleteName}} è stato aggiunto al sistema',
      emailSubject: 'Benvenuto {{athleteName}}!',
      emailBody: 'L\'atleta {{athleteName}} è stato registrato con successo nel sistema.',
      variables: ['athleteName', 'teamName'],
      isActive: true,
      isSystem: true
    },
    {
      name: 'Allenamento annullato',
      type: 'training_cancelled',
      title: 'Allenamento annullato',
      message: 'L\'allenamento del {{date}} è stato annullato',
      emailSubject: 'Allenamento annullato - {{date}}',
      emailBody: 'L\'allenamento previsto per il {{date}} è stato annullato. Motivo: {{reason}}',
      variables: ['date', 'reason'],
      isActive: true,
      isSystem: true
    },
    {
      name: 'Infortunio registrato',
      type: 'injury_registered',
      title: 'Infortunio registrato',
      message: 'Registrato infortunio per {{athleteName}}: {{description}}',
      emailSubject: 'Infortunio atleta - {{athleteName}}',
      emailBody: 'È stato registrato un infortunio per l\'atleta {{athleteName}}. Descrizione: {{description}}. Gravità: {{severity}}',
      variables: ['athleteName', 'description', 'severity'],
      isActive: true,
      isSystem: true
    }
  ];

  /**
   * Recupera tutti i template (sistema + personalizzati)
   */
  async getTemplates(organizationId?: string): Promise<NotificationTemplate[]> {
    try {
      // Template di sistema
      let templates = [...this.systemTemplates];

      // Se specificata un'organizzazione, aggiungi template personalizzati
      if (organizationId) {
        const customTemplates = await this.getCustomTemplates(organizationId);
        
        // I template personalizzati sovrascrivono quelli di sistema con lo stesso tipo
        const customTypes = new Set(customTemplates.map(t => t.type));
        
        templates = templates.filter(t => !customTypes.has(t.type));
        templates.push(...customTemplates);
      }

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return this.systemTemplates;
    }
  }

  /**
   * Recupera un template specifico
   */
  async getTemplate(
    type: string,
    organizationId?: string
  ): Promise<NotificationTemplate | null> {
    try {
      // Prima cerca tra i template personalizzati
      if (organizationId) {
        const custom = await this.getCustomTemplate(type, organizationId);
        if (custom) return custom;
      }

      // Poi cerca tra i template di sistema
      return this.systemTemplates.find(t => t.type === type) || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Crea template personalizzato
   */
  async createCustomTemplate(
    template: NotificationTemplate,
    organizationId: string
  ): Promise<NotificationTemplate> {
    try {
      // Verifica che non esista già un template custom per questo tipo
      const existing = await prisma.notificationTemplate.findFirst({
        where: {
          type: template.type,
          organizationId
        }
      });

      if (existing) {
        throw new BadRequestError('Template già esistente per questo tipo');
      }

      const created = await prisma.notificationTemplate.create({
        data: {
          name: template.name,
          type: template.type,
          title: template.title,
          message: template.message,
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          variables: template.variables,
          isActive: template.isActive,
          organizationId
        }
      });

      console.log(`✅ Template personalizzato creato: ${template.name}`);
      return this.mapPrismaTemplate(created);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Aggiorna template personalizzato
   */
  async updateCustomTemplate(
    id: string,
    updates: Partial<NotificationTemplate>,
    organizationId: string
  ): Promise<NotificationTemplate> {
    try {
      const template = await prisma.notificationTemplate.findFirst({
        where: { id, organizationId }
      });

      if (!template) {
        throw new NotFoundError('Template non trovato');
      }

      const updated = await prisma.notificationTemplate.update({
        where: { id },
        data: {
          name: updates.name,
          title: updates.title,
          message: updates.message,
          emailSubject: updates.emailSubject,
          emailBody: updates.emailBody,
          variables: updates.variables,
          isActive: updates.isActive
        }
      });

      console.log(`✅ Template aggiornato: ${updated.name}`);
      return this.mapPrismaTemplate(updated);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Elimina template personalizzato
   */
  async deleteCustomTemplate(id: string, organizationId: string) {
    try {
      const template = await prisma.notificationTemplate.findFirst({
        where: { id, organizationId }
      });

      if (!template) {
        throw new NotFoundError('Template non trovato');
      }

      await prisma.notificationTemplate.delete({
        where: { id }
      });

      console.log(`✅ Template eliminato: ${template.name}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Resetta template ai valori di sistema
   */
  async resetToSystemTemplate(type: string, organizationId: string) {
    try {
      // Elimina template personalizzato se esiste
      const custom = await prisma.notificationTemplate.findFirst({
        where: { type, organizationId }
      });

      if (custom) {
        await prisma.notificationTemplate.delete({
          where: { id: custom.id }
        });
      }

      console.log(`✅ Template ${type} resettato ai valori di sistema`);
      return { success: true };
    } catch (error) {
      console.error('Error resetting template:', error);
      throw error;
    }
  }

  /**
   * Compila template con variabili
   */
  compileTemplate(
    template: NotificationTemplate,
    variables: Record<string, any>
  ): {
    title: string;
    message: string;
    emailSubject?: string;
    emailBody?: string;
  } {
    let title = template.title;
    let message = template.message;
    let emailSubject = template.emailSubject;
    let emailBody = template.emailBody;

    // Sostituisci le variabili nel template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = String(value);

      title = title.replace(new RegExp(placeholder, 'g'), replacement);
      message = message.replace(new RegExp(placeholder, 'g'), replacement);
      
      if (emailSubject) {
        emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), replacement);
      }
      
      if (emailBody) {
        emailBody = emailBody.replace(new RegExp(placeholder, 'g'), replacement);
      }
    }

    return { title, message, emailSubject, emailBody };
  }

  /**
   * Recupera template personalizzati dal database
   */
  private async getCustomTemplates(organizationId: string): Promise<NotificationTemplate[]> {
    try {
      const templates = await prisma.notificationTemplate.findMany({
        where: { organizationId }
      });

      return templates.map(t => this.mapPrismaTemplate(t));
    } catch (error) {
      console.error('Error getting custom templates:', error);
      return [];
    }
  }

  /**
   * Recupera singolo template personalizzato
   */
  private async getCustomTemplate(
    type: string,
    organizationId: string
  ): Promise<NotificationTemplate | null> {
    try {
      const template = await prisma.notificationTemplate.findFirst({
        where: { type, organizationId }
      });

      return template ? this.mapPrismaTemplate(template) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mappa template da Prisma
   */
  private mapPrismaTemplate(template: any): NotificationTemplate {
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      title: template.title,
      message: template.message,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      variables: template.variables as string[],
      isActive: template.isActive,
      organizationId: template.organizationId,
      isSystem: false
    };
  }

  /**
   * Esporta template come JSON
   */
  async exportTemplates(organizationId: string): Promise<string> {
    const templates = await this.getTemplates(organizationId);
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Importa template da JSON
   */
  async importTemplates(
    jsonData: string,
    organizationId: string
  ): Promise<{ imported: number; failed: number }> {
    try {
      const templates = JSON.parse(jsonData) as NotificationTemplate[];
      let imported = 0;
      let failed = 0;

      for (const template of templates) {
        try {
          await this.createCustomTemplate(template, organizationId);
          imported++;
        } catch (error) {
          failed++;
        }
      }

      return { imported, failed };
    } catch (error) {
      throw new BadRequestError('Formato JSON non valido');
    }
  }
}

// Esporta singleton
export default new NotificationTemplatesService();
