import { PrismaClient, PaymentStatus, PaymentType } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { NotificationService } from './notification.service';
import SocketService from './socket.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { addDays, differenceInDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PDFService } from './pdf.service';

const prisma = new PrismaClient();

export class PaymentService {
  private notificationService: NotificationService;
  private pdfService: PDFService;

  constructor() {
    this.notificationService = new NotificationService();
    this.pdfService = new PDFService();
    console.log('💰 Payment Service inizializzato');
  }

  /**
   * Crea un nuovo pagamento per un atleta
   */
  async createPayment(data: {
    organizationId: string;
    athleteId: string;
    typeId: number;
    amount: number;
    dueDate: Date;
    description?: string;
    notes?: string;
    createdById: string;
  }) {
    console.log('💰 Creazione nuovo pagamento:', data);

    // Verifica che l'atleta esista
    const athlete = await prisma.athlete.findFirst({
      where: {
        id: data.athleteId,
        organizationId: data.organizationId
      }
    });

    if (!athlete) {
      throw new NotFoundError('Atleta non trovato');
    }

    // Verifica che il tipo di pagamento esista
    const paymentType = await prisma.paymentType.findUnique({
      where: { id: data.typeId }
    });

    if (!paymentType) {
      throw new NotFoundError('Tipo di pagamento non trovato');
    }

    // Crea il pagamento
    const payment = await prisma.payment.create({
      data: {
        organizationId: data.organizationId,
        athleteId: data.athleteId,
        typeId: data.typeId,
        amount: data.amount,
        dueDate: data.dueDate,
        description: data.description || paymentType.name,
        notes: data.notes,
        status: 'PENDING' as PaymentStatus,
        createdById: data.createdById
      },
      include: {
        athlete: true,
        type: true
      }
    });

    console.log('✅ Pagamento creato:', payment.id);

    // Invia notifica all'atleta
    await this.notificationService.createNotification({
      organizationId: data.organizationId,
      userId: null, // Per ora null, verrà gestito dopo
      type: 'PAYMENT_CREATED',
      title: 'Nuovo pagamento',
      message: `È stato creato un pagamento di €${data.amount} con scadenza ${format(data.dueDate, 'dd/MM/yyyy')}`,
      priority: 'normal',
      data: { paymentId: payment.id, athleteId: data.athleteId }
    });

    // Notifica real-time
    if (SocketService.isInitialized()) {
      SocketService.sendToOrganization(
        data.organizationId,
        'payment:created',
        { payment }
      );
    }

    return payment;
  }

  /**
   * Recupera tutti i pagamenti di un atleta
   */
  async getPaymentsByAthlete(athleteId: string, organizationId: string) {
    console.log('💰 Recupero pagamenti atleta:', athleteId);

    const payments = await prisma.payment.findMany({
      where: {
        athleteId,
        organizationId
      },
      include: {
        type: true
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    // Calcola statistiche
    const stats = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'PAID').length,
      pending: payments.filter(p => p.status === 'PENDING').length,
      overdue: payments.filter(p => p.status === 'OVERDUE').length,
      cancelled: payments.filter(p => p.status === 'CANCELLED').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0)
    };

    return { payments, stats };
  }

  /**
   * Recupera tutti i pagamenti dell'organizzazione con filtri
   */
  async getPaymentsByOrganization(
    organizationId: string,
    filters?: {
      status?: PaymentStatus;
      athleteId?: string;
      typeId?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    console.log('💰 Recupero pagamenti organizzazione con filtri:', filters);

    const where: any = { organizationId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.athleteId) where.athleteId = filters.athleteId;
      if (filters.typeId) where.typeId = filters.typeId;
      if (filters.fromDate || filters.toDate) {
        where.dueDate = {};
        if (filters.fromDate) where.dueDate.gte = filters.fromDate;
        if (filters.toDate) where.dueDate.lte = filters.toDate;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        athlete: true,
        type: true
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    return payments;
  }

  /**
   * Aggiorna lo stato di un pagamento
   */
  async updatePaymentStatus(id: string, status: PaymentStatus, organizationId: string) {
    console.log('💰 Aggiornamento stato pagamento:', id, status);

    const payment = await prisma.payment.findFirst({
      where: { id, organizationId }
    });

    if (!payment) {
      throw new NotFoundError('Pagamento non trovato');
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        athlete: true,
        type: true
      }
    });

    // Invia notifica appropriata
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'PAID':
        notificationTitle = 'Pagamento ricevuto';
        notificationMessage = `Il pagamento di €${payment.amount} è stato registrato`;
        break;
      case 'CANCELLED':
        notificationTitle = 'Pagamento annullato';
        notificationMessage = `Il pagamento di €${payment.amount} è stato annullato`;
        break;
      case 'OVERDUE':
        notificationTitle = 'Pagamento scaduto';
        notificationMessage = `Il pagamento di €${payment.amount} è scaduto`;
        break;
    }

    if (notificationTitle) {
      await this.notificationService.createNotification({
        organizationId,
        userId: null, // Per ora null
        type: `PAYMENT_${status}`,
        title: notificationTitle,
        message: notificationMessage,
        priority: status === 'OVERDUE' ? 'high' : 'normal',
        data: { paymentId: id, athleteId: payment.athleteId }
      });
    }

    // Notifica real-time
    if (SocketService.isInitialized()) {
      SocketService.sendToOrganization(
        organizationId,
        'payment:statusChanged',
        { payment: updated, oldStatus: payment.status, newStatus: status }
      );
    }

    console.log('✅ Stato pagamento aggiornato:', status);
    return updated;
  }

  /**
   * Registra un pagamento effettuato
   */
  async recordPayment(
    id: string,
    data: {
      amount: number;
      paymentDate: Date;
      paymentMethod?: string;
      notes?: string;
    },
    organizationId: string
  ) {
    console.log('💰 Registrazione pagamento:', id, data);

    const payment = await prisma.payment.findFirst({
      where: { id, organizationId },
      include: { athlete: true }
    });

    if (!payment) {
      throw new NotFoundError('Pagamento non trovato');
    }

    if (payment.status === 'PAID') {
      throw new BadRequestError('Questo pagamento è già stato registrato');
    }

    // Aggiorna il pagamento
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: data.amount >= payment.amount ? 'PAID' : 'PARTIAL',
        paidAmount: data.amount,
        paidDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        notes: data.notes ? `${payment.notes || ''}\nPagamento: ${data.notes}` : payment.notes
      },
      include: {
        athlete: true,
        type: true
      }
    });

    // Crea notifica di conferma
    await this.notificationService.createNotification({
      organizationId,
      userId: null, // Per ora null
      type: 'PAYMENT_RECEIVED',
      title: 'Pagamento ricevuto',
      message: `Pagamento di €${data.amount} registrato per ${payment.athlete.firstName} ${payment.athlete.lastName}`,
      priority: 'normal',
      data: { paymentId: id, athleteId: payment.athleteId }
    });

    // Notifica real-time
    if (SocketService.isInitialized()) {
      SocketService.sendToOrganization(
        organizationId,
        'payment:recorded',
        { payment: updated }
      );
    }

    console.log('✅ Pagamento registrato con successo');
    return updated;
  }

  /**
   * Recupera tutti i pagamenti scaduti
   */
  async getOverduePayments(organizationId: string) {
    console.log('💰 Recupero pagamenti scaduti');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePayments = await prisma.payment.findMany({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: today }
      },
      include: {
        athlete: true,
        type: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Aggiorna lo stato a OVERDUE se necessario
    const toUpdate = overduePayments.filter(p => p.status === 'PENDING');
    if (toUpdate.length > 0) {
      await prisma.payment.updateMany({
        where: {
          id: { in: toUpdate.map(p => p.id) }
        },
        data: {
          status: 'OVERDUE'
        }
      });

      console.log(`⚠️ Aggiornati ${toUpdate.length} pagamenti a OVERDUE`);
    }

    // Calcola statistiche
    const stats = {
      count: overduePayments.length,
      totalAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
      oldestDays: overduePayments.length > 0 
        ? differenceInDays(today, overduePayments[0].dueDate)
        : 0,
      byAthlete: this.groupPaymentsByAthlete(overduePayments)
    };

    return { payments: overduePayments, stats };
  }

  /**
   * Genera statistiche sui pagamenti
   */
  async getPaymentStats(organizationId: string, month?: Date) {
    console.log('💰 Generazione statistiche pagamenti');

    const targetMonth = month || new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    // Pagamenti del mese
    const monthPayments = await prisma.payment.findMany({
      where: {
        organizationId,
        dueDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Calcola statistiche
    const stats = {
      month: format(targetMonth, 'MMMM yyyy', { locale: it }),
      totalExpected: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      totalCollected: monthPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: monthPayments
        .filter(p => p.status === 'PENDING' || p.status === 'PARTIAL')
        .reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0),
      totalOverdue: monthPayments
        .filter(p => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0),
      collectionRate: 0,
      paymentsByType: await this.getPaymentsByType(organizationId, monthStart, monthEnd),
      paymentsByStatus: this.groupPaymentsByStatus(monthPayments),
      trend: await this.getPaymentTrend(organizationId)
    };

    // Calcola tasso di riscossione
    if (stats.totalExpected > 0) {
      stats.collectionRate = Math.round((stats.totalCollected / stats.totalExpected) * 100);
    }

    return stats;
  }

  /**
   * Invia promemoria per pagamenti in scadenza
   */
  async sendPaymentReminders(organizationId: string) {
    console.log('💰 Invio promemoria pagamenti in scadenza');

    const reminderDays = [7, 3, 1]; // Giorni prima della scadenza per inviare promemoria
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let remindersSent = 0;

    for (const days of reminderDays) {
      const targetDate = addDays(today, days);
      targetDate.setHours(23, 59, 59, 999);

      const payments = await prisma.payment.findMany({
        where: {
          organizationId,
          status: 'PENDING',
          dueDate: {
            gte: addDays(today, days),
            lte: targetDate
          }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      for (const payment of payments) {
        await this.notificationService.createNotification({
          organizationId,
          userId: null, // Per ora null
          type: 'PAYMENT_REMINDER',
          title: `Pagamento in scadenza tra ${days} ${days === 1 ? 'giorno' : 'giorni'}`,
          message: `Il pagamento di €${payment.amount} per ${payment.athlete.firstName} ${payment.athlete.lastName} scade il ${format(payment.dueDate, 'dd/MM/yyyy')}`,
          priority: days === 1 ? 'high' : 'normal',
          data: { paymentId: payment.id, athleteId: payment.athleteId, daysUntilDue: days }
        });

        remindersSent++;
      }
    }

    console.log(`✅ Inviati ${remindersSent} promemoria pagamenti`);
    return { remindersSent };
  }

  /**
   * Crea pagamenti multipli (es. quota mensile per tutti gli atleti)
   */
  async bulkCreatePayments(
    data: {
      organizationId: string;
      athleteIds: string[];
      typeId: number;
      amount: number;
      dueDate: Date;
      description?: string;
      createdById: string;
    }
  ) {
    console.log('💰 Creazione pagamenti multipli:', data.athleteIds.length, 'atleti');

    const results = {
      created: [] as any[],
      failed: [] as any[],
      total: data.athleteIds.length
    };

    for (const athleteId of data.athleteIds) {
      try {
        const payment = await this.createPayment({
          organizationId: data.organizationId,
          athleteId,
          typeId: data.typeId,
          amount: data.amount,
          dueDate: data.dueDate,
          description: data.description,
          createdById: data.createdById
        });

        results.created.push(payment);
      } catch (error: any) {
        results.failed.push({
          athleteId,
          error: error.message
        });
        console.error(`❌ Errore creazione pagamento per atleta ${athleteId}:`, error.message);
      }
    }

    console.log(`✅ Creati ${results.created.length} pagamenti su ${results.total}`);

    // Notifica real-time
    if (SocketService.isInitialized()) {
      SocketService.sendToOrganization(
        data.organizationId,
        'payments:bulkCreated',
        { results }
      );
    }

    return results;
  }

  /**
   * Genera una ricevuta per un pagamento
   */
  async generateReceipt(paymentId: string, organizationId: string) {
    console.log('💰 Generazione ricevuta per pagamento:', paymentId);

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        organizationId,
        status: 'PAID'
      },
      include: {
        athlete: true,
        type: true,
        organization: true
      }
    });

    if (!payment) {
      throw new NotFoundError('Pagamento non trovato o non ancora pagato');
    }

    // Genera dati ricevuta
    const receiptData = {
      receiptNumber: `RIC-${payment.organization.id.slice(0, 4)}-${Date.now()}`,
      date: new Date(),
      organization: {
        name: payment.organization.name,
        taxCode: payment.organization.taxCode || '',
        address: payment.organization.address || undefined,
        phone: payment.organization.phone || undefined,
        email: payment.organization.email || undefined
      },
      athlete: {
        name: `${payment.athlete.firstName} ${payment.athlete.lastName}`,
        fiscalCode: payment.athlete.fiscalCode || undefined,
        birthDate: payment.athlete.birthDate
      },
      payment: {
        type: payment.type.name,
        description: payment.description || '',
        amount: payment.amount,
        paidAmount: payment.paidAmount || payment.amount,
        paidDate: payment.paidDate || new Date(),
        paymentMethod: payment.paymentMethod || undefined
      }
    };

    // Genera PDF
    const pdfBuffer = await this.pdfService.generatePaymentReceipt(receiptData);

    console.log('✅ Ricevuta generata:', receiptData.receiptNumber);
    
    return {
      ...receiptData,
      pdf: pdfBuffer.toString('base64')
    };
  }

  /**
   * Genera report mensile in PDF
   */
  async generateMonthlyReport(organizationId: string, month: Date) {
    console.log('💰 Generazione report mensile');

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Recupera organizzazione
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new NotFoundError('Organizzazione non trovata');
    }

    // Recupera pagamenti del mese
    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        dueDate: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      include: {
        athlete: true,
        type: true
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ]
    });

    // Calcola statistiche
    const stats = await this.getPaymentStats(organizationId, month);

    // Prepara dati per report
    const reportData = {
      organization,
      month: format(month, 'MMMM yyyy', { locale: it }),
      payments: payments.map(p => ({
        athlete: {
          name: `${p.athlete.firstName} ${p.athlete.lastName}`,
          fiscalCode: p.athlete.fiscalCode
        },
        type: p.type.name,
        amount: p.amount,
        paidAmount: p.paidAmount || 0,
        dueDate: p.dueDate,
        paidDate: p.paidDate,
        status: p.status,
        paymentMethod: p.paymentMethod
      })),
      stats
    };

    // Genera PDF
    const pdfBuffer = await this.pdfService.generateMonthlyPaymentReport(reportData);

    console.log('✅ Report mensile generato');
    
    return {
      month: format(month, 'yyyy-MM'),
      pdf: pdfBuffer.toString('base64'),
      stats
    };
  }

  /**
   * Esporta pagamenti in Excel per commercialista
   */
  async exportToExcel(organizationId: string, fromDate: Date, toDate: Date) {
    console.log('💰 Export Excel pagamenti');

    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        dueDate: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        athlete: true,
        type: true
      },
      orderBy: [
        { dueDate: 'asc' },
        { athlete: { lastName: 'asc' } }
      ]
    });

    const exportData = {
      payments,
      period: {
        from: fromDate,
        to: toDate
      }
    };

    // Genera Excel/CSV
    const excelBuffer = await this.pdfService.generateExcelExport(exportData);

    console.log('✅ Export Excel generato');
    
    return {
      filename: `pagamenti_${format(fromDate, 'yyyy-MM-dd')}_${format(toDate, 'yyyy-MM-dd')}.csv`,
      data: excelBuffer.toString('base64'),
      mimeType: 'text/csv'
    };
  }

  private groupPaymentsByAthlete(payments: any[]) {
    const grouped: { [key: string]: any } = {};

    payments.forEach(payment => {
      const athleteKey = payment.athleteId;
      if (!grouped[athleteKey]) {
        grouped[athleteKey] = {
          athlete: payment.athlete,
          payments: [],
          totalAmount: 0
        };
      }
      grouped[athleteKey].payments.push(payment);
      grouped[athleteKey].totalAmount += payment.amount;
    });

    return Object.values(grouped);
  }

  private groupPaymentsByStatus(payments: any[]) {
    const grouped: { [key: string]: number } = {
      PENDING: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0,
      PARTIAL: 0
    };

    payments.forEach(payment => {
      grouped[payment.status] = (grouped[payment.status] || 0) + 1;
    });

    return grouped;
  }

  private async getPaymentsByType(organizationId: string, fromDate: Date, toDate: Date) {
    const payments = await prisma.payment.groupBy({
      by: ['typeId'],
      where: {
        organizationId,
        dueDate: {
          gte: fromDate,
          lte: toDate
        }
      },
      _sum: {
        amount: true,
        paidAmount: true
      },
      _count: true
    });

    // Aggiungi i nomi dei tipi
    const types = await prisma.paymentType.findMany();
    const typesMap = new Map(types.map(t => [t.id, t.name]));

    return payments.map(p => ({
      typeId: p.typeId,
      typeName: typesMap.get(p.typeId) || 'Sconosciuto',
      count: p._count,
      totalAmount: p._sum.amount || 0,
      totalPaid: p._sum.paidAmount || 0
    }));
  }

  private async getPaymentTrend(organizationId: string) {
    const months = 6; // Ultimi 6 mesi
    const trend = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const payments = await prisma.payment.aggregate({
        where: {
          organizationId,
          dueDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amount: true,
          paidAmount: true
        }
      });

      trend.push({
        month: format(monthDate, 'MMM yyyy', { locale: it }),
        expected: payments._sum.amount || 0,
        collected: payments._sum.paidAmount || 0
      });
    }

    return trend;
  }



  /**
   * Controlla e aggiorna i pagamenti scaduti (da eseguire con cron job)
   */
  async checkAndUpdateOverduePayments() {
    console.log('💰 Controllo pagamenti scaduti...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trova tutti i pagamenti PENDING con scadenza passata
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today }
      },
      include: {
        athlete: true,
        organization: true
      }
    });

    if (overduePayments.length === 0) {
      console.log('✅ Nessun nuovo pagamento scaduto');
      return { updated: 0 };
    }

    // Aggiorna lo stato a OVERDUE
    await prisma.payment.updateMany({
      where: {
        id: { in: overduePayments.map(p => p.id) }
      },
      data: {
        status: 'OVERDUE'
      }
    });

    // Invia notifiche per ogni pagamento scaduto
    for (const payment of overduePayments) {
      await this.notificationService.createNotification({
      organizationId: payment.organizationId,
      userId: null, // Per ora null
        type: 'PAYMENT_OVERDUE',
        title: 'Pagamento scaduto',
        message: `Il pagamento di €${payment.amount} per ${payment.athlete.firstName} ${payment.athlete.lastName} è scaduto`,
        priority: 'high',
        data: { paymentId: payment.id, athleteId: payment.athleteId }
      });

      // Notifica real-time
      if (SocketService.isInitialized()) {
        SocketService.sendToOrganization(
          payment.organizationId,
          'payment:overdue',
          { payment }
        );
      }
    }

    console.log(`⚠️ Aggiornati ${overduePayments.length} pagamenti a OVERDUE`);
    return { updated: overduePayments.length };
  }
}


