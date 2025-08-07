// backend/src/services/document.service.ts
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { addDays, differenceInDays, isBefore, startOfDay } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import SocketService from './socket.service';

const prisma = new PrismaClient();

export class DocumentService {
  // Directory per salvare i file
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/documents';
  
  // Tipi di file accettati
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Dimensione massima file (10MB)
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  constructor() {
    // Crea la directory uploads se non esiste
    this.ensureUploadDirectory();
  }

  /**
   * Assicura che la directory uploads esista
   */
  private async ensureUploadDirectory() {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      console.log(`📁 Directory uploads creata: ${this.UPLOAD_DIR}`);
    }
  }

  /**
   * Upload di un nuovo documento
   */
  async uploadDocument(
    file: Express.Multer.File,
    data: {
      athleteId: string;
      typeId: number;
      organizationId: string;
      issueDate?: Date;
      expiryDate?: Date;
      notes?: string;
    },
    uploadedBy: string
  ) {
    try {
      // Validazioni file
      this.validateFile(file);

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

      // Verifica che il tipo documento esista
      const documentType = await prisma.documentType.findUnique({
        where: { id: data.typeId }
      });

      if (!documentType) {
        throw new NotFoundError('Tipo documento non trovato');
      }

      // Genera nome file sicuro
      const secureFileName = this.generateSecureFileName(file.originalname);
      const filePath = path.join(this.UPLOAD_DIR, secureFileName);

      // Salva il file su disco
      await fs.writeFile(filePath, file.buffer);

      // Calcola lo stato del documento
      const status = this.calculateDocumentStatus(data.expiryDate);

      // Crea record nel database
      const document = await prisma.document.create({
        data: {
          athleteId: data.athleteId,
          organizationId: data.organizationId,
          typeId: data.typeId,
          fileName: file.originalname,
          fileUrl: `/uploads/documents/${secureFileName}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          issueDate: data.issueDate || new Date(),
          expiryDate: data.expiryDate,
          status,
          notes: data.notes,
          uploadedBy,
          isVerified: false
        },
        include: {
          athlete: true,
          type: true
        }
      });

      // Se il documento sta per scadere, crea una notifica
      if (status === 'EXPIRING' && data.expiryDate) {
        await this.createExpiryNotification(document, athlete, data.expiryDate);
      }

      console.log(`📄 Documento caricato: ${file.originalname} per ${athlete.firstName} ${athlete.lastName}`);

      return document;
    } catch (error) {
      console.error('Errore upload documento:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti i documenti di un atleta
   */
  async getAthleteDocuments(athleteId: string, organizationId: string) {
    try {
      const documents = await prisma.document.findMany({
        where: {
          athleteId,
          organizationId
        },
        include: {
          type: true,
          verifiedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { expiryDate: 'asc' }
        ]
      });

      // Aggiorna lo stato dei documenti se necessario
      const updatedDocuments = await Promise.all(
        documents.map(async (doc) => {
          if (doc.expiryDate) {
            const newStatus = this.calculateDocumentStatus(doc.expiryDate);
            if (newStatus !== doc.status) {
              return await this.updateDocumentStatus(doc.id, newStatus);
            }
          }
          return doc;
        })
      );

      return updatedDocuments;
    } catch (error) {
      console.error('Errore recupero documenti:', error);
      throw new BadRequestError('Errore nel recupero dei documenti');
    }
  }

  /**
   * Verifica un documento (solo staff autorizzato)
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    notes?: string
  ) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          athlete: true,
          type: true
        }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          isVerified: true,
          verifiedBy,
          verifiedAt: new Date(),
          notes: notes ? `${document.notes || ''}\nVerifica: ${notes}` : document.notes
        }
      });

      // Invia notifica all'atleta
      await this.createVerificationNotification(document);

      console.log(`✅ Documento verificato: ${document.fileName}`);

      return updated;
    } catch (error) {
      console.error('Errore verifica documento:', error);
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(documentId: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      // Elimina il file fisico
      const filePath = path.join(process.cwd(), document.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Errore eliminazione file:', error);
      }

      // Elimina dal database
      await prisma.document.delete({
        where: { id: documentId }
      });

      console.log(`🗑️ Documento eliminato: ${document.fileName}`);

      return { success: true };
    } catch (error) {
      console.error('Errore eliminazione documento:', error);
      throw error;
    }
  }

  /**
   * Controlla documenti in scadenza (da chiamare con cron job)
   */
  async checkExpiringDocuments() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);
      const sevenDaysFromNow = addDays(today, 7);

      // Trova documenti che scadono nei prossimi 30 giorni
      const expiringDocuments = await prisma.document.findMany({
        where: {
          expiryDate: {
            gte: today,
            lte: thirtyDaysFromNow
          },
          status: {
            not: 'EXPIRED'
          }
        },
        include: {
          athlete: true,
          type: true,
          organization: true
        }
      });

      let notificationsSent = 0;

      for (const doc of expiringDocuments) {
        if (!doc.expiryDate) continue;

        const daysUntilExpiry = differenceInDays(doc.expiryDate, today);
        let newStatus: DocumentStatus = 'VALID';
        let shouldNotify = false;

        // Determina lo stato e se inviare notifica
        if (daysUntilExpiry <= 0) {
          newStatus = 'EXPIRED';
          shouldNotify = true;
        } else if (daysUntilExpiry <= 7) {
          newStatus = 'EXPIRING';
          shouldNotify = daysUntilExpiry === 7 || daysUntilExpiry === 1;
        } else if (daysUntilExpiry <= 30) {
          newStatus = 'EXPIRING';
          shouldNotify = daysUntilExpiry === 30 || daysUntilExpiry === 14;
        }

        // Aggiorna stato se cambiato
        if (newStatus !== doc.status) {
          await this.updateDocumentStatus(doc.id, newStatus);
        }

        // Invia notifica se necessario
        if (shouldNotify) {
          await this.createExpiryNotification(doc, doc.athlete, doc.expiryDate);
          notificationsSent++;
        }
      }

      // Marca come scaduti i documenti scaduti
      const expiredDocuments = await prisma.document.updateMany({
        where: {
          expiryDate: {
            lt: today
          },
          status: {
            not: 'EXPIRED'
          }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      console.log(`📋 Controllo documenti completato:
        - Documenti controllati: ${expiringDocuments.length}
        - Documenti scaduti: ${expiredDocuments.count}
        - Notifiche inviate: ${notificationsSent}`);

      return {
        checked: expiringDocuments.length,
        expired: expiredDocuments.count,
        notificationsSent
      };
    } catch (error) {
      console.error('Errore controllo documenti:', error);
      throw new BadRequestError('Errore nel controllo documenti in scadenza');
    }
  }

  /**
   * Ottieni statistiche documenti per organizzazione
   */
  async getDocumentStats(organizationId: string) {
    try {
      const [total, byStatus, byType, missingRequired] = await Promise.all([
        // Totale documenti
        prisma.document.count({
          where: { organizationId }
        }),
        
        // Per stato
        prisma.document.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true
        }),
        
        // Per tipo
        prisma.document.groupBy({
          by: ['typeId'],
          where: { organizationId },
          _count: true
        }),
        
        // Atleti senza documenti obbligatori
        this.getAthletesWithMissingDocuments(organizationId)
      ]);

      // Formatta statistiche per tipo
      const types = await prisma.documentType.findMany();
      const byTypeFormatted = types.map(type => ({
        type: type.name,
        count: byType.find(t => t.typeId === type.id)?._count || 0,
        required: type.isRequired
      }));

      return {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count
        })),
        byType: byTypeFormatted,
        athletesWithMissingDocuments: missingRequired.length,
        missingDocumentsList: missingRequired
      };
    } catch (error) {
      console.error('Errore statistiche documenti:', error);
      throw new BadRequestError('Errore nel calcolo statistiche documenti');
    }
  }

  /**
   * Ottieni atleti con documenti mancanti
   */
  private async getAthletesWithMissingDocuments(organizationId: string) {
    try {
      // Trova tutti i tipi di documento obbligatori
      const requiredTypes = await prisma.documentType.findMany({
        where: { isRequired: true }
      });

      // Trova tutti gli atleti dell'organizzazione
      const athletes = await prisma.athlete.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          documents: {
            where: {
              status: {
                not: 'EXPIRED'
              }
            }
          }
        }
      });

      const athletesWithMissing = [];

      for (const athlete of athletes) {
        const uploadedTypeIds = new Set(athlete.documents.map(d => d.typeId));
        const missingTypes = requiredTypes.filter(t => !uploadedTypeIds.has(t.id));

        if (missingTypes.length > 0) {
          athletesWithMissing.push({
            athleteId: athlete.id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            missingDocuments: missingTypes.map(t => t.name)
          });
        }
      }

      return athletesWithMissing;
    } catch (error) {
      console.error('Errore ricerca documenti mancanti:', error);
      return [];
    }
  }

  // --- Metodi Helper Privati ---

  /**
   * Valida il file caricato
   */
  private validateFile(file: Express.Multer.File) {
    // Controlla tipo MIME
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Tipo file non supportato. Tipi accettati: PDF, JPG, PNG, DOC, DOCX`
      );
    }

    // Controlla dimensione
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestError(
        `File troppo grande. Dimensione massima: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Genera nome file sicuro
   */
  private generateSecureFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  /**
   * Calcola lo stato del documento in base alla scadenza
   */
  private calculateDocumentStatus(expiryDate?: Date | null): DocumentStatus {
    if (!expiryDate) return 'VALID';

    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, today);

    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRING';
    return 'VALID';
  }

  /**
   * Aggiorna lo stato di un documento
   */
  private async updateDocumentStatus(documentId: string, status: DocumentStatus) {
    return await prisma.document.update({
      where: { id: documentId },
      data: { status }
    });
  }

  /**
   * Crea notifica per documento in scadenza
   */
  private async createExpiryNotification(document: any, athlete: any, expiryDate: Date) {
    try {
      const daysUntilExpiry = differenceInDays(expiryDate, new Date());
      
      // Trova utenti da notificare
      const users = await prisma.user.findMany({
        where: {
          userOrganizations: {
            some: {
              organizationId: document.organizationId
            }
          }
        },
        select: { id: true }
      });

      // Determina priorità
      let priority: 'urgent' | 'high' | 'normal' = 'normal';
      if (daysUntilExpiry <= 0) priority = 'urgent';
      else if (daysUntilExpiry <= 7) priority = 'high';

      // Crea notifiche per ogni utente
      for (const user of users) {
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            organizationId: document.organizationId,
            type: 'document_expiry',
            title: daysUntilExpiry <= 0 ? 'Documento scaduto!' : 'Documento in scadenza',
            message: `${document.type.name} di ${athlete.firstName} ${athlete.lastName} ${
              daysUntilExpiry <= 0 
                ? 'è scaduto' 
                : `scade tra ${daysUntilExpiry} giorni`
            }`,
            priority,
            link: `/athletes/${athlete.id}/documents`,
            data: {
              documentId: document.id,
              athleteId: athlete.id,
              daysUntilExpiry
            },
            status: 'unread',
            isRead: false
          }
        });

        // Invia via Socket.io
        SocketService.sendNotification(user.id, notification);
      }
    } catch (error) {
      console.error('Errore creazione notifica scadenza:', error);
    }
  }

  /**
   * Crea notifica per documento verificato
   */
  private async createVerificationNotification(document: any) {
    try {
      // Trova utenti da notificare
      const users = await prisma.user.findMany({
        where: {
          userOrganizations: {
            some: {
              organizationId: document.organizationId
            }
          }
        },
        select: { id: true }
      });

      for (const user of users) {
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            organizationId: document.organizationId,
            type: 'document_verified',
            title: 'Documento verificato',
            message: `${document.type.name} di ${document.athlete.firstName} ${document.athlete.lastName} è stato verificato`,
            priority: 'normal',
            link: `/athletes/${document.athleteId}/documents`,
            data: {
              documentId: document.id,
              athleteId: document.athleteId
            },
            status: 'unread',
            isRead: false
          }
        });

        // Invia via Socket.io
        SocketService.sendNotification(user.id, notification);
      }
    } catch (error) {
      console.error('Errore creazione notifica verifica:', error);
    }
  }
}

export default new DocumentService();