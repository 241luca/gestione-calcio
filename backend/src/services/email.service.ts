// backend/src/services/email.service.ts
import { PrismaClient } from '@prisma/client';
import * as SibApiV3Sdk from '@sendinblue/client';

const prisma = new PrismaClient();

export class EmailService {
  private apiInstance: any;
  private sender = {
    name: 'Soccer Manager',
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@soccermanager.com'
  };

  constructor() {
    // Configura Brevo API
    const apiKey = SibApiV3Sdk.ApiClient.instance.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || 'YOUR-API-KEY';
    
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  /**
   * Invia email transazionale
   */
  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.textContent = textContent || this.stripHtml(htmlContent);
      sendSmtpEmail.sender = this.sender;
      sendSmtpEmail.to = [{ email: to }];
      
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log(`📧 Email inviata a ${to}: ${subject}`);
      return result;
    } catch (error) {
      console.error('Errore invio email:', error);
      throw error;
    }
  }

  /**
   * Invia email di notifica per documenti in scadenza
   */
  async sendDocumentExpiryEmail(
    userEmail: string,
    athleteName: string,
    documentType: string,
    expiryDate: Date,
    daysUntilExpiry: number
  ) {
    const urgency = daysUntilExpiry <= 7 ? 'URGENTE' : 'IMPORTANTE';
    const color = daysUntilExpiry <= 7 ? '#dc2626' : '#ea580c';
    
    const subject = `[${urgency}] Documento in scadenza - ${athleteName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: ${color}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚽ Soccer Manager</h1>
            <h2>Notifica Documento in Scadenza</h2>
          </div>
          <div class="content">
            <div class="alert">
              <strong>${urgency}:</strong> Il documento scade tra ${daysUntilExpiry} giorni!
            </div>
            
            <h3>Dettagli:</h3>
            <p><strong>Atleta:</strong> ${athleteName}</p>
            <p><strong>Tipo Documento:</strong> ${documentType}</p>
            <p><strong>Data Scadenza:</strong> ${expiryDate.toLocaleDateString('it-IT')}</p>
            
            <p>È necessario rinnovare il documento prima della scadenza per garantire la regolarità dell'atleta.</p>
            
            <a href="${process.env.APP_URL}/athletes" class="button">Vai al Sistema</a>
            
            <div class="footer">
              <p>Questa è una notifica automatica dal sistema Soccer Manager.</p>
              <p>Non rispondere a questa email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Invia email di notifica per pagamenti scaduti
   */
  async sendPaymentOverdueEmail(
    userEmail: string,
    athleteName: string,
    amount: number,
    dueDate: Date
  ) {
    const subject = `[URGENTE] Pagamento scaduto - ${athleteName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #dc2626; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Pagamento Scaduto</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>ATTENZIONE:</strong> Questo pagamento è scaduto!
            </div>
            
            <h3>Dettagli Pagamento:</h3>
            <p><strong>Atleta:</strong> ${athleteName}</p>
            <p><strong>Data Scadenza:</strong> ${dueDate.toLocaleDateString('it-IT')}</p>
            
            <div class="amount">€ ${amount.toFixed(2)}</div>
            
            <p>Si prega di regolarizzare il pagamento al più presto per evitare la sospensione dalle attività.</p>
            
            <a href="${process.env.APP_URL}/payments" class="button">Gestisci Pagamenti</a>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Invia digest giornaliero delle notifiche
   */
  async sendDailyDigest(userEmail: string, notifications: any[]) {
    if (notifications.length === 0) return;
    
    const subject = `Riepilogo giornaliero - ${notifications.length} notifiche`;
    
    const notificationsList = notifications.map(n => `
      <div style="border-left: 3px solid ${this.getPriorityColor(n.priority)}; padding-left: 15px; margin: 15px 0;">
        <strong>${n.title}</strong><br>
        ${n.message}<br>
        <small style="color: #666;">
          ${new Date(n.createdAt).toLocaleString('it-IT')}
        </small>
      </div>
    `).join('');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .summary { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Riepilogo Giornaliero</h1>
            <p>${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="content">
            <div class="summary">
              <h3>Hai ${notifications.length} notifiche non lette:</h3>
              ${notificationsList}
            </div>
            
            <center>
              <a href="${process.env.APP_URL}/notifications" class="button">Vedi Tutte le Notifiche</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(userEmail, subject, htmlContent);
  }

  /**
   * Invia email di benvenuto per nuovo atleta
   */
  async sendWelcomeEmail(
    parentEmail: string,
    athleteName: string,
    teamName: string
  ) {
    const subject = `Benvenuto in Soccer Manager - ${athleteName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .welcome { text-align: center; font-size: 24px; color: #10b981; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Benvenuto!</h1>
          </div>
          <div class="content">
            <div class="welcome">
              ${athleteName} è stato registrato con successo!
            </div>
            
            <div class="info-box">
              <h3>Prossimi passi:</h3>
              <ol>
                <li>Completa il caricamento dei documenti richiesti</li>
                <li>Verifica i dati anagrafici inseriti</li>
                <li>Configura le preferenze di notifica</li>
                <li>Controlla il calendario delle attività</li>
              </ol>
              
              <p><strong>Squadra assegnata:</strong> ${teamName || 'Da assegnare'}</p>
            </div>
            
            <p>Per qualsiasi domanda, non esitare a contattarci.</p>
            
            <center>
              <a href="${process.env.APP_URL}" class="button" style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
                Accedi al Sistema
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(parentEmail, subject, htmlContent);
  }

  /**
   * Rimuove tag HTML dal testo
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Ottiene colore in base alla priorità
   */
  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'normal': return '#3b82f6';
      default: return '#6b7280';
    }
  }
}

// Esporta singleton
export default new EmailService();
