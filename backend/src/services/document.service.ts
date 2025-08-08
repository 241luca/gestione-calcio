// backend/src/services/document.service.ts - VERSIONE CORRETTA FINALE
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { addDays, differenceInDays } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export class DocumentService {
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Upload documento
   */
  async uploadDocument(
    file: Express.Multer.File,
    data: {
      athleteId: string;
      typeId: number;
      issueDate?: string;
      expiryDate?: string;
      notes?: string;
      organizationId: string;
      uploadedBy?: string; // ID dell'utente che carica il documento
    }
  ) {
    try {
      // Validazioni base
      if (!file) {
        throw new BadRequestError('Nessun file caricato');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestError('File troppo grande (max 10MB)');
      }

      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestError('Tipo di file non supportato');
      }

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

      // Se non abbiamo uploadedBy, usiamo un ID di sistema
      // In produzione questo dovrebbe venire dall'utente autenticato
      const uploadedBy = data.uploadedBy || 'system';

      // Crea il documento nel database
      const document = await prisma.document.create({
        data: {
          organizationId: data.organizationId,
          athleteId: data.athleteId,
          typeId: data.typeId,
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          issueDate: data.issueDate ? new Date(data.issueDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          status: 'VALID',
          notes: data.notes,
          isVerified: false,
          uploadedBy: uploadedBy // Campo stringa come da schema
        },
        include: {
          athlete: true,
          type: true
        }
      });

      // Aggiorna lo stato se il documento è in scadenza
      if (document.expiryDate) {
        const daysUntilExpiry = differenceInDays(document.expiryDate, new Date());
        if (daysUntilExpiry < 0) {
          await prisma.document.update({
            where: { id: document.id },
            data: { status: 'EXPIRED' }
          });
          document.status = 'EXPIRED';
        } else if (daysUntilExpiry <= 30) {
          await prisma.document.update({
            where: { id: document.id },
            data: { status: 'EXPIRING' }
          });
          document.status = 'EXPIRING';
        }
      }

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Recupera documenti con filtri
   */
  async getDocuments(
    organizationId: string,
    filters: any = {},
    pagination: { page: number; limit: number }
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const where: any = {
        organizationId,
        ...(filters.athleteId && { athleteId: filters.athleteId }),
        ...(filters.typeId && { typeId: filters.typeId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.isVerified !== undefined && { isVerified: filters.isVerified })
      };

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            athlete: true,
            type: true
            // Rimosso uploadedBy e verifiedBy perché sono stringhe, non relazioni
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.document.count({ where })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting documents:', error);
      throw new BadRequestError('Errore nel recupero dei documenti');
    }
  }

  /**
   * Recupera un singolo documento
   */
  async getDocumentById(id: string, organizationId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: { id, organizationId },
        include: {
          athlete: true,
          type: true
          // Rimosso uploadedBy e verifiedBy perché sono stringhe, non relazioni
        }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      return document;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Verifica un documento
   */
  async verifyDocument(id: string, organizationId: string, verifiedBy: string) {
    try {
      const document = await prisma.document.findFirst({
        where: { id, organizationId }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      if (document.isVerified) {
        throw new BadRequestError('Documento già verificato');
      }

      const updated = await prisma.document.update({
        where: { id },
        data: {
          isVerified: true,
          verifiedBy: verifiedBy, // Stringa ID dell'utente che verifica
          verifiedAt: new Date()
        },
        include: {
          athlete: true,
          type: true
          // Rimosso uploadedBy e verifiedBy perché sono stringhe, non relazioni
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
  async deleteDocument(id: string, organizationId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: { id, organizationId }
      });

      if (!document) {
        throw new NotFoundError('Documento non trovato');
      }

      // Elimina il file fisico se esiste
      if (document.fileUrl && document.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(this.UPLOAD_DIR, path.basename(document.fileUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Elimina dal database
      await prisma.document.delete({
        where: { id }
      });

      return { success: true, message: 'Documento eliminato con successo' };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Aggiorna stato documenti scaduti (chiamato da cron job)
   */
  async updateExpiredDocuments() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = addDays(now, 30);

      // Documenti scaduti
      await prisma.document.updateMany({
        where: {
          expiryDate: { lt: now },
          status: { not: 'EXPIRED' }
        },
        data: { status: 'EXPIRED' }
      });

      // Documenti in scadenza
      await prisma.document.updateMany({
        where: {
          expiryDate: {
            gte: now,
            lte: thirtyDaysFromNow
          },
          status: { not: 'EXPIRING' }
        },
        data: { status: 'EXPIRING' }
      });

      // Documenti validi
      await prisma.document.updateMany({
        where: {
          expiryDate: { gt: thirtyDaysFromNow },
          status: { not: 'VALID' }
        },
        data: { status: 'VALID' }
      });

      return { success: true, message: 'Stati documenti aggiornati' };
    } catch (error) {
      console.error('Error updating expired documents:', error);
      throw error;
    }
  }

  /**
   * Statistiche documenti
   */
  async getDocumentStats(organizationId: string) {
    try {
      const [total, byStatus, byType, unverified] = await Promise.all([
        prisma.document.count({
          where: { organizationId }
        }),
        prisma.document.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true
        }),
        prisma.document.groupBy({
          by: ['typeId'],
          where: { organizationId },
          _count: true
        }),
        prisma.document.count({
          where: { organizationId, isVerified: false }
        })
      ]);

      // Recupera i nomi dei tipi di documento
      const types = await prisma.documentType.findMany();
      const typeMap = new Map(types.map(t => [t.id, t.name]));

      return {
        total,
        unverified,
        verified: total - unverified,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count
        })),
        byType: byType.map(t => ({
          typeId: t.typeId,
          typeName: typeMap.get(t.typeId) || 'Sconosciuto',
          count: t._count
        }))
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw new BadRequestError('Errore nel recupero delle statistiche');
    }
  }

  /**
   * Recupera documenti in scadenza
   */
  async getExpiringDocuments(organizationId: string, days: number = 30) {
    try {
      const futureDate = addDays(new Date(), days);

      const documents = await prisma.document.findMany({
        where: {
          organizationId,
          expiryDate: {
            gte: new Date(),
            lte: futureDate
          }
        },
        include: {
          athlete: true,
          type: true
          // Rimosso uploadedBy perché è una stringa, non una relazione
        },
        orderBy: {
          expiryDate: 'asc'
        }
      });

      return documents;
    } catch (error) {
      console.error('Error getting expiring documents:', error);
      throw new BadRequestError('Errore nel recupero dei documenti in scadenza');
    }
  }
}
