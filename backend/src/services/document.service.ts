// backend/src/services/document.service.ts - VERSIONE SEMPLIFICATA
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ResponseFormatter } from '../utils/responseFormatter';
import NotificationService from './notification.service';
import SocketService from './socket.service';
import { addDays, differenceInDays, format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class DocumentService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads/documents';

  constructor() {
    // Crea la directory uploads se non esiste
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload di un documento
   */
  async uploadDocument(
    file: Express.Multer.File,
    athleteId: string,
    typeId: number,
    organizationId: string,
    uploadedById: string,
    expiryDate?: Date
  ) {
    try {
      // Verifica che l'atleta esista
      const athlete = await prisma.athlete.findFirst({
        where: { id: athleteId, organizationId }
      });

      if (!athlete) {
        throw new NotFoundError('Atleta non trovato');
      }

      // Determina lo stato del documento
      let status: DocumentStatus = 'VALID';
      if (expiryDate) {
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        if (daysUntilExpiry < 0) {
          status = 'EXPIRED';
        } else if (daysUntilExpiry <= 30) {
          status = 'EXPIRING';
        }
      }

      // Crea il record del documento
      const document = await prisma.document.create({
        data: {
          athleteId,
          typeId,
          fileName: file.originalname,
          fileUrl: `/uploads/documents/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          expiryDate,
          status,
          organizationId,
          uploadedById
        },
        include: {
          athlete: true,
          type: true
        }
      });

      // Invia notifica se il documento sta per scadere
      if (status === 'EXPIRING' && expiryDate) {
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        await notificationService.sendDocumentExpiryNotification(
          athleteId,
          document.type.name,
          daysUntilExpiry,
          organizationId
        );
      }

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti i documenti di un atleta
   */
  async getDocumentsByAthlete(athleteId: string, organizationId: string) {
    try {
      const documents = await prisma.document.findMany({
        where: {
          athleteId,
          organizationId
        },
        include: {
          type: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw new BadRequestError('Errore nel recupero dei documenti');
    }
  }

  /**
   * Verifica un documento
   */
  async verifyDocument(
    documentId: string,
    verifiedById: string,
    organizationId: string
  ) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      if (document.isVerified) {
        throw new BadRequestError('Documento già verificato');
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          isVerified: true,
          verifiedById,
          verifiedAt: new Date()
        },
        include: {
          athlete: true,
          type: true
        }
      });

      return updated;
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(documentId: string, organizationId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId
        }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      // Elimina il file fisico se esiste
      const filePath = path.join(process.cwd(), document.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Elimina il record dal database
      await prisma.document.delete({
        where: { id: documentId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Controlla documenti in scadenza
   */
  async checkExpiringDocuments(organizationId: string) {
    try {
      const thirtyDaysFromNow = addDays(new Date(), 30);
      
      const expiringDocuments = await prisma.document.findMany({
        where: {
          organizationId,
          expiryDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          },
          status: {
            not: 'EXPIRED'
          }
        },
        include: {
          athlete: true,
          type: true
        }
      });

      // Aggiorna lo stato dei documenti
      for (const doc of expiringDocuments) {
        if (doc.expiryDate) {
          const daysUntilExpiry = differenceInDays(doc.expiryDate, new Date());
          
          let newStatus: DocumentStatus = 'VALID';
          if (daysUntilExpiry <= 30) {
            newStatus = 'EXPIRING';
          }

          if (newStatus !== doc.status) {
            await prisma.document.update({
              where: { id: doc.id },
              data: { status: newStatus }
            });

            // Invia notifica
            if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 1) {
              await notificationService.sendDocumentExpiryNotification(
                doc.athleteId,
                doc.type.name,
                daysUntilExpiry,
                organizationId
              );
            }
          }
        }
      }

      return expiringDocuments.length;
    } catch (error) {
      console.error('Error checking expiring documents:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche documenti
   */
  async getDocumentStats(organizationId: string) {
    try {
      const [total, valid, expiring, expired] = await Promise.all([
        prisma.document.count({ where: { organizationId } }),
        prisma.document.count({ where: { organizationId, status: 'VALID' } }),
        prisma.document.count({ where: { organizationId, status: 'EXPIRING' } }),
        prisma.document.count({ where: { organizationId, status: 'EXPIRED' } })
      ]);

      return {
        total,
        valid,
        expiring,
        expired,
        completionRate: total > 0 ? Math.round((valid / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }

  /**
   * Recupera i tipi di documento disponibili
   */
  async getDocumentTypes() {
    try {
      const types = await prisma.documentType.findMany({
        orderBy: {
          name: 'asc'
        }
      });

      return types;
    } catch (error) {
      console.error('Error getting document types:', error);
      throw new BadRequestError('Errore nel recupero dei tipi di documento');
    }
  }
}

export default DocumentService;
