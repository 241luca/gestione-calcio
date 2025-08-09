// backend/src/services/athlete.service.ts - VERSIONE SEMPLIFICATA
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import EventNotificationService from './event-notifications.service';

const prisma = new PrismaClient();

export class AthleteService {
  /**
   * Recupera lista atleti con filtri e paginazione
   */
  async getAthletes(
    organizationId: string,
    filters: any = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: string }
  ) {
    try {
      const { page = 1, limit = 50, sortBy = 'lastName', sortOrder = 'asc' } = pagination;
      const skip = (page - 1) * limit;

      // Costruisci la clausola where
      const where: any = {
        organizationId,
        ...(filters.teamId && { teamId: filters.teamId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { fiscalCode: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };

      // Esegui le query
      const [athletes, total] = await Promise.all([
        prisma.athlete.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            team: true,
            position: true,
            transportZone: true,
            _count: {
              select: {
                documents: true,
                payments: true,
                matchRoster: true,
                injuries: true
              }
            }
          }
        }),
        prisma.athlete.count({ where })
      ]);

      return {
        athletes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting athletes:', error);
      throw new BadRequestError('Errore nel recupero degli atleti');
    }
  }

  /**
   * Recupera dettagli singolo atleta
   */
  async getAthleteById(id: string, organizationId: string) {
    try {
      const athlete = await prisma.athlete.findFirst({
        where: { id, organizationId },
        include: {
          team: true,
          position: true,
          transportZone: true,
          documents: {
            include: { type: true },
            orderBy: { expiryDate: 'asc' }
          },
          payments: {
            include: { type: true },
            orderBy: { dueDate: 'desc' },
            take: 10
          },
          matchRoster: {
            include: {
              match: {
                include: {
                  homeTeam: true,
                  awayTeam: true,
                  competition: true
                }
              }
            },
            orderBy: { match: { date: 'desc' } },
            take: 10
          },
          injuries: {
            orderBy: { injuryDate: 'desc' }
          }
        }
      });

      if (!athlete) {
        throw new NotFoundError('Atleta non trovato');
      }

      return athlete;
    } catch (error) {
      console.error('Error getting athlete:', error);
      throw error;
    }
  }

  /**
   * Crea nuovo atleta
   */
  async createAthlete(data: any, organizationId: string, userId?: string) {
    try {
      // Verifica codice fiscale univoco
      if (data.fiscalCode) {
        const existing = await prisma.athlete.findFirst({
          where: {
            fiscalCode: data.fiscalCode,
            organizationId
          }
        });

        if (existing) {
          throw new ConflictError('Codice fiscale già presente');
        }
      }

      // Verifica numero maglia univoco nel team
      if (data.jerseyNumber && data.teamId) {
        const existingJersey = await prisma.athlete.findFirst({
          where: {
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            organizationId
          }
        });

        if (existingJersey) {
          throw new ConflictError('Numero maglia già assegnato in questa squadra');
        }
      }

      // Crea l'atleta
      const athlete = await prisma.athlete.create({
        data: {
          ...data,
          organizationId,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          medicalExpiryDate: data.medicalExpiryDate ? new Date(data.medicalExpiryDate) : null,
          status: data.status || 'ACTIVE'
        },
        include: {
          team: true,
          position: true,
          transportZone: true
        }
      });

      // NOTIFICA: Nuovo atleta registrato
      await EventNotificationService.notifyNewAthlete(athlete, organizationId);

      return athlete;
    } catch (error) {
      console.error('Error creating athlete:', error);
      throw error;
    }
  }

  /**
   * Aggiorna atleta
   */
  async updateAthlete(id: string, data: any, organizationId: string, userId?: string) {
    try {
      // Verifica che l'atleta esista
      const existing = await prisma.athlete.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        throw new NotFoundError('Atleta non trovato');
      }

      // Verifica codice fiscale se cambiato
      if (data.fiscalCode && data.fiscalCode !== existing.fiscalCode) {
        const duplicate = await prisma.athlete.findFirst({
          where: {
            fiscalCode: data.fiscalCode,
            organizationId,
            id: { not: id }
          }
        });

        if (duplicate) {
          throw new ConflictError('Codice fiscale già presente');
        }
      }

      // Verifica numero maglia se cambiato
      if (data.jerseyNumber && (data.teamId || existing.teamId)) {
        const teamId = data.teamId || existing.teamId;
        const duplicateJersey = await prisma.athlete.findFirst({
          where: {
            jerseyNumber: data.jerseyNumber,
            teamId,
            organizationId,
            id: { not: id }
          }
        });

        if (duplicateJersey) {
          throw new ConflictError('Numero maglia già assegnato in questa squadra');
        }
      }

      // Prepara i dati per l'aggiornamento - rimuovi campi che non esistono nel DB
      const updateData: any = {};
      
      // Campi base sempre presenti nel modello Athlete
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
      if (data.fiscalCode !== undefined) updateData.fiscalCode = data.fiscalCode;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
      if (data.parentName !== undefined) updateData.parentName = data.parentName;
      if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone;
      if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.teamId !== undefined) updateData.teamId = data.teamId;
      if (data.positionId !== undefined) updateData.positionId = data.positionId;
      if (data.jerseyNumber !== undefined) updateData.jerseyNumber = data.jerseyNumber;
      if (data.transportZoneId !== undefined) updateData.transportZoneId = data.transportZoneId;
      
      // Campo medicalExpiryDate esiste nel modello
      if (data.medicalExpiryDate !== undefined) {
        updateData.medicalExpiryDate = data.medicalExpiryDate ? new Date(data.medicalExpiryDate) : null;
      }
      
      // IGNORA campi che non esistono nel modello
      // medicalCertificateDate e medicalCertificateExpiry NON esistono nel modello Athlete

      // Aggiorna l'atleta
      const updated = await prisma.athlete.update({
        where: { id },
        data: updateData,
        include: {
          team: true,
          position: true,
          transportZone: true
        }
      });

      return updated;
    } catch (error) {
      console.error('Error updating athlete:', error);
      throw error;
    }
  }

  /**
   * Elimina atleta (soft delete)
   */
  async deleteAthlete(id: string, organizationId: string, userId?: string) {
    try {
      const athlete = await prisma.athlete.findFirst({
        where: { id, organizationId }
      });

      if (!athlete) {
        throw new NotFoundError('Atleta non trovato');
      }

      // Verifica se ci sono pagamenti pendenti
      const pendingPayments = await prisma.payment.count({
        where: {
          athleteId: id,
          status: { in: ['PENDING', 'OVERDUE'] }
        }
      });

      if (pendingPayments > 0) {
        throw new BadRequestError('Non puoi eliminare un atleta con pagamenti in sospeso');
      }

      // Soft delete - imposta come INACTIVE
      await prisma.athlete.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          teamId: null
        }
      });

      return { success: true, message: 'Atleta eliminato con successo' };
    } catch (error) {
      console.error('Error deleting athlete:', error);
      throw error;
    }
  }

  /**
   * Statistiche atleti
   */
  async getAthleteStats(organizationId: string) {
    try {
      const [total, byStatus, byTeam] = await Promise.all([
        prisma.athlete.count({
          where: { organizationId }
        }),
        prisma.athlete.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true
        }),
        prisma.athlete.groupBy({
          by: ['teamId'],
          where: { organizationId },
          _count: true
        })
      ]);

      // Recupera i nomi dei team
      const teams = await prisma.team.findMany({
        where: { organizationId }
      });
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      return {
        total,
        active: byStatus.find(s => s.status === 'ACTIVE')?._count || 0,
        inactive: byStatus.find(s => s.status === 'INACTIVE')?._count || 0,
        injured: byStatus.find(s => s.status === 'INJURED')?._count || 0,
        suspended: byStatus.find(s => s.status === 'SUSPENDED')?._count || 0,
        byTeam: byTeam
          .filter(t => t.teamId !== null)
          .map(t => ({
            teamId: t.teamId,
            teamName: teamMap.get(t.teamId!) || 'Sconosciuto',
            count: t._count
          }))
      };
    } catch (error) {
      console.error('Error getting athlete stats:', error);
      throw new BadRequestError('Errore nel recupero delle statistiche');
    }
  }

  /**
   * Importa atleti da CSV
   */
  async bulkImportAthletes(athletes: any[], organizationId: string) {
    const results = {
      imported: [] as any[],
      failed: [] as any[],
      total: athletes.length
    };

    for (const [index, athleteData] of athletes.entries()) {
      try {
        const athlete = await this.createAthlete(athleteData, organizationId);
        results.imported.push({
          row: index + 1,
          athlete
        });
      } catch (error: any) {
        results.failed.push({
          row: index + 1,
          data: athleteData,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Esporta atleti in formato CSV/Excel
   */
  async exportAthletes(organizationId: string, format: string = 'csv') {
    try {
      const athletes = await prisma.athlete.findMany({
        where: { organizationId },
        include: {
          team: true,
          position: true
        }
      });

      const data = athletes.map(athlete => ({
        Nome: athlete.firstName,
        Cognome: athlete.lastName,
        'Data di Nascita': athlete.birthDate,
        'Codice Fiscale': athlete.fiscalCode,
        Email: athlete.email,
        Telefono: athlete.phone,
        Squadra: athlete.team?.name || '',
        Posizione: athlete.position?.name || '',
        Stato: athlete.status
      }));

      return {
        data,
        format,
        filename: `atleti_${new Date().toISOString().split('T')[0]}`
      };
    } catch (error) {
      throw new BadRequestError('Errore nell\'esportazione degli atleti');
    }
  }

  /**
   * Ottieni documenti dell'atleta
   */
  async getAthleteDocuments(athleteId: string, organizationId: string) {
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
      throw new BadRequestError('Errore nel recupero dei documenti');
    }
  }

  /**
   * Ottieni pagamenti dell'atleta
   */
  async getAthletePayments(athleteId: string, organizationId: string) {
    try {
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

      return payments;
    } catch (error) {
      throw new BadRequestError('Errore nel recupero dei pagamenti');
    }
  }

  /**
   * Crea atleti in blocco
   */
  async bulkCreateAthletes(athletes: any[], organizationId: string) {
    return this.bulkImportAthletes(athletes, organizationId);
  }

  /**
   * Aggiorna stato atleta
   */
  async updateAthleteStatus(id: string, status: string, organizationId: string) {
    try {
      const athlete = await prisma.athlete.update({
        where: {
          id,
          organizationId
        },
        data: {
          status
        }
      });

      return athlete;
    } catch (error) {
      throw new BadRequestError('Errore nell\'aggiornamento dello stato');
    }
  }

  /**
   * Upload foto atleta
   */
  async uploadAthletePhoto(athleteId: string, photoUrl: string, organizationId: string) {
    try {
      const athlete = await prisma.athlete.update({
        where: {
          id: athleteId,
          organizationId
        },
        data: {
          photo: photoUrl
        }
      });

      return athlete;
    } catch (error) {
      throw new BadRequestError('Errore nel caricamento della foto');
    }
  }

  /**
   * Ripristina atleta eliminato
   */
  async restoreAthlete(id: string, organizationId: string, userId?: string) {
    try {
      const athlete = await prisma.athlete.update({
        where: {
          id,
          organizationId
        },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });

      return athlete;
    } catch (error) {
      throw new BadRequestError('Errore nel ripristino dell\'atleta');
    }
  }
}
