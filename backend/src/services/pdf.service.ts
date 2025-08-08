// backend/src/services/pdf.service.ts
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

export class PDFService {
  /**
   * Genera ricevuta pagamento in PDF
   */
  async generatePaymentReceipt(data: {
    receiptNumber: string;
    date: Date;
    organization: {
      name: string;
      taxCode: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    athlete: {
      name: string;
      fiscalCode?: string;
      birthDate?: Date;
    };
    payment: {
      type: string;
      description?: string;
      amount: number;
      paidAmount: number;
      paidDate: Date;
      paymentMethod?: string;
    };
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header con logo (se disponibile)
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(data.organization.name, { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`C.F./P.IVA: ${data.organization.taxCode}`, { align: 'center' });
      
      if (data.organization.address) {
        doc.text(data.organization.address, { align: 'center' });
      }
      
      if (data.organization.phone || data.organization.email) {
        doc.text(
          `${data.organization.phone || ''} ${data.organization.email ? '- ' + data.organization.email : ''}`,
          { align: 'center' }
        );
      }

      doc.moveDown(2);

      // Titolo ricevuta
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('RICEVUTA DI PAGAMENTO', { align: 'center' });
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`N° ${data.receiptNumber}`, { align: 'center' });
      
      doc.moveDown(2);

      // Dati atleta
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('RICEVUTO DA:', { underline: true });
      
      doc.font('Helvetica')
         .text(`Nome: ${data.athlete.name}`);
      
      if (data.athlete.fiscalCode) {
        doc.text(`Codice Fiscale: ${data.athlete.fiscalCode}`);
      }
      
      if (data.athlete.birthDate) {
        doc.text(`Data di nascita: ${format(data.athlete.birthDate, 'dd/MM/yyyy')}`);
      }

      doc.moveDown();

      // Dettagli pagamento
      doc.font('Helvetica-Bold')
         .text('DETTAGLI PAGAMENTO:', { underline: true });
      
      doc.font('Helvetica')
         .text(`Tipo: ${data.payment.type}`);
      
      if (data.payment.description) {
        doc.text(`Descrizione: ${data.payment.description}`);
      }
      
      doc.text(`Importo dovuto: € ${data.payment.amount.toFixed(2)}`);
      doc.text(`Importo pagato: € ${data.payment.paidAmount.toFixed(2)}`);
      
      if (data.payment.paidAmount < data.payment.amount) {
        const remaining = data.payment.amount - data.payment.paidAmount;
        doc.fillColor('red')
           .text(`Rimanente: € ${remaining.toFixed(2)}`)
           .fillColor('black');
      }
      
      doc.text(`Data pagamento: ${format(data.payment.paidDate, 'dd/MM/yyyy')}`);
      
      if (data.payment.paymentMethod) {
        const methods: { [key: string]: string } = {
          cash: 'Contanti',
          bank_transfer: 'Bonifico Bancario',
          card: 'Carta di Credito/Debito',
          check: 'Assegno',
          other: 'Altro'
        };
        doc.text(`Metodo: ${methods[data.payment.paymentMethod] || data.payment.paymentMethod}`);
      }

      doc.moveDown(3);

      // Footer
      doc.fontSize(10)
         .text(`Data emissione: ${format(data.date, 'dd/MM/yyyy HH:mm')}`, {
           align: 'left'
         });

      doc.moveDown(2);

      // Firme
      doc.text('_________________________                    _________________________');
      doc.text('        Il Ricevente                                    Il Pagante        ', {
        align: 'center'
      });

      // Note legali
      doc.moveDown(2);
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text('Documento non valido ai fini fiscali se non accompagnato da scontrino o fattura.', {
           align: 'center'
         });

      doc.end();
    });
  }

  /**
   * Genera report mensile pagamenti
   */
  async generateMonthlyPaymentReport(data: {
    organization: any;
    month: string;
    payments: any[];
    stats: any;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'landscape'
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text(`Report Pagamenti - ${data.month}`, { align: 'center' });
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.organization.name, { align: 'center' });

      doc.moveDown(2);

      // Statistiche
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('RIEPILOGO', { underline: true });

      doc.fontSize(11)
         .font('Helvetica');

      const col1 = 50;
      const col2 = 250;
      const col3 = 450;
      
      let y = doc.y;
      
      doc.text('Totale Previsto:', col1, y);
      doc.text(`€ ${data.stats.totalExpected.toFixed(2)}`, col2, y);
      
      y += 20;
      doc.text('Totale Incassato:', col1, y);
      doc.text(`€ ${data.stats.totalCollected.toFixed(2)}`, col2, y);
      doc.text(`(${data.stats.collectionRate}%)`, col3, y);
      
      y += 20;
      doc.text('In Attesa:', col1, y);
      doc.text(`€ ${data.stats.totalPending.toFixed(2)}`, col2, y);
      
      y += 20;
      doc.text('Scaduti:', col1, y);
      doc.text(`€ ${data.stats.totalOverdue.toFixed(2)}`, col2, y);

      doc.moveDown(3);

      // Tabella pagamenti
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('DETTAGLIO PAGAMENTI', { underline: true });

      doc.moveDown();

      // Header tabella
      doc.fontSize(10)
         .font('Helvetica-Bold');

      const tableTop = doc.y;
      const colWidths = [150, 100, 80, 80, 80, 80, 100];
      let xPos = 50;

      doc.text('Atleta', xPos, tableTop);
      xPos += colWidths[0];
      doc.text('Tipo', xPos, tableTop);
      xPos += colWidths[1];
      doc.text('Importo', xPos, tableTop);
      xPos += colWidths[2];
      doc.text('Pagato', xPos, tableTop);
      xPos += colWidths[3];
      doc.text('Scadenza', xPos, tableTop);
      xPos += colWidths[4];
      doc.text('Stato', xPos, tableTop);
      xPos += colWidths[5];
      doc.text('Metodo', xPos, tableTop);

      // Linea sotto header
      doc.moveTo(50, tableTop + 15)
         .lineTo(720, tableTop + 15)
         .stroke();

      // Righe tabella
      doc.font('Helvetica')
         .fontSize(9);

      let yPos = tableTop + 25;
      
      data.payments.forEach((payment, index) => {
        if (yPos > 500) {
          // Nuova pagina se necessario
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        
        doc.text(payment.athlete.name.substring(0, 25), xPos, yPos);
        xPos += colWidths[0];
        
        doc.text(payment.type.substring(0, 15), xPos, yPos);
        xPos += colWidths[1];
        
        doc.text(`€ ${payment.amount.toFixed(2)}`, xPos, yPos);
        xPos += colWidths[2];
        
        doc.text(`€ ${(payment.paidAmount || 0).toFixed(2)}`, xPos, yPos);
        xPos += colWidths[3];
        
        doc.text(format(new Date(payment.dueDate), 'dd/MM/yy'), xPos, yPos);
        xPos += colWidths[4];
        
        // Stato con colore
        const statusColors: { [key: string]: string } = {
          PAID: 'green',
          PENDING: 'orange',
          OVERDUE: 'red',
          CANCELLED: 'gray'
        };
        
        doc.fillColor(statusColors[payment.status] || 'black')
           .text(payment.status, xPos, yPos)
           .fillColor('black');
        xPos += colWidths[5];
        
        doc.text(payment.paymentMethod || '-', xPos, yPos);
        
        yPos += 18;
      });

      // Footer
      doc.fontSize(8)
         .font('Helvetica')
         .text(
           `Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
           50,
           550
         );

      doc.end();
    });
  }

  /**
   * Genera export Excel per commercialista
   */
  async generateExcelExport(data: any): Promise<Buffer> {
    // TODO: Implementare con ExcelJS
    // Per ora restituiamo un CSV
    const csv = this.generateCSV(data);
    return Buffer.from(csv, 'utf-8');
  }

  private generateCSV(data: any): string {
    const headers = [
      'Data Scadenza',
      'Atleta',
      'Codice Fiscale',
      'Tipo Pagamento',
      'Descrizione',
      'Importo',
      'Importo Pagato',
      'Data Pagamento',
      'Metodo Pagamento',
      'Stato',
      'Note'
    ];

    const rows = data.payments.map((p: any) => [
      format(new Date(p.dueDate), 'dd/MM/yyyy'),
      `${p.athlete.firstName} ${p.athlete.lastName}`,
      p.athlete.fiscalCode || '',
      p.type.name,
      p.description || '',
      p.amount.toFixed(2),
      (p.paidAmount || 0).toFixed(2),
      p.paidDate ? format(new Date(p.paidDate), 'dd/MM/yyyy') : '',
      p.paymentMethod || '',
      p.status,
      p.notes || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((r: any[]) => r.join(';'))
    ].join('\n');

    return csvContent;
  }
}

export default new PDFService();
