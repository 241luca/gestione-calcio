import { Request, Response } from 'express';
import { PrismaClient, AthleteStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from './auth.service';

const prisma = new PrismaClient();

// Schema di validazione per creare un atleta
const createAthleteSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  birthDate: z.string().transform(str => new Date(str)),
  birthPlace: z.string().optional(),
  nationality: z.string().default('Italiana'),
  fiscalCode: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
  teamId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  jerseyNumber: z.number().int().positive().optional(),
  status: z.nativeEnum(AthleteStatus).default(AthleteStatus.ACTIVE),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email().optional(),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional()
});

// Schema per l'aggiornamento (tutti i campi opzionali)
const updateAthleteSchema = createAthleteSchema.partial();

class AthleteService {
  /**
   * Ottieni lista atleti con paginazione e filtri
   */
  async getAthletes(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      
      // Parametri di paginazione
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;
      
      // Filtri opzionali
      const { teamId, status, search } = req.query;
      
      // Costruisci la query
      const where: any = { organizationId };
      
      if (teamId) where.teamId = teamId;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { fiscalCode: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Esegui le query in parallelo
      const [athletes, total] = await Promise.all([
        prisma.athlete.findMany({
          where,
          skip,
          take: limit,
          orderBy: { lastName: 'asc' },
          include: {
            team: true,
            position: true,
            _count: {
              select: {
                documents: true,
                payments: true,
                injuries: true
              }
            }
          }
        }),
        prisma.athlete.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          athletes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get athletes error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero atleti'
      });
    }
  }

  /**
   * Ottieni dettagli singolo atleta
   */
  async getAthleteById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const athlete = await prisma.athlete.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          team: true,
          position: true,
          documents: {
            include: { type: true },
            orderBy: { expiryDate: 'asc' }
          },
          payments: {
            include: { type: true },
            orderBy: { dueDate: 'desc' },
            take: 10
          },
          injuries: {
            orderBy: { injuryDate: 'desc' }
          },
          attendances: {
            include: { session: true },
            orderBy: { session: { date: 'desc' } },
            take: 10
          }
        }
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: 'Atleta non trovato'
        });
      }

      // Calcola statistiche aggiuntive
      const stats = {
        documentsValid: athlete.documents.filter(d => d.status === 'VALID').length,
        documentsExpiring: athlete.documents.filter(d => d.status === 'EXPIRING').length,
        documentsExpired: athlete.documents.filter(d => d.status === 'EXPIRED').length,
        paymentsPending: athlete.payments.filter(p => p.status === 'PENDING').length,
        paymentsOverdue: athlete.payments.filter(p => p.status === 'OVERDUE').length,
        activeInjuries: athlete.injuries.filter(i => !i.isRecovered).length
      };

      res.json({
        success: true,
        data: {
          ...athlete,
          stats
        }
      });
    } catch (error) {
      console.error('Get athlete error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero atleta'
      });
    }
  }

  /**
   * Crea nuovo atleta
   */
  async createAthlete(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      
      // Valida i dati
      const data = createAthleteSchema.parse(req.body);

      // Controlla se il codice fiscale esiste già (se fornito)
      if (data.fiscalCode) {
        const existing = await prisma.athlete.findFirst({
          where: { 
            fiscalCode: data.fiscalCode,
            organizationId 
          }
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            error: 'Codice fiscale già registrato'
          });
        }
      }

      // Controlla numero maglia se specificato
      if (data.jerseyNumber && data.teamId) {
        const existingJersey = await prisma.athlete.findFirst({
          where: {
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            status: AthleteStatus.ACTIVE
          }
        });

        if (existingJersey) {
          return res.status(409).json({
            success: false,
            error: `Numero maglia ${data.jerseyNumber} già assegnato in questa squadra`
          });
        }
      }

      // Crea l'atleta
      const athlete = await prisma.athlete.create({
        data: {
          ...data,
          organizationId,
          status: data.status || AthleteStatus.ACTIVE
        },
        include: {
          team: true,
          position: true
        }
      });

      res.status(201).json({
        success: true,
        data: athlete,
        message: 'Atleta creato con successo'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Dati non validi',
          details: error.errors
        });
      }

      console.error('Create athlete error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore creazione atleta'
      });
    }
  }

  /**
   * Aggiorna atleta
   */
  async updateAthlete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      
      // Valida i dati
      const data = updateAthleteSchema.parse(req.body);

      // Verifica che l'atleta esista e appartenga all'organizzazione
      const existing = await prisma.athlete.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Atleta non trovato'
        });
      }

      // Controlla codice fiscale se cambiato
      if (data.fiscalCode && data.fiscalCode !== existing.fiscalCode) {
        const duplicate = await prisma.athlete.findFirst({
          where: { 
            fiscalCode: data.fiscalCode,
            organizationId,
            id: { not: id }
          }
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            error: 'Codice fiscale già registrato'
          });
        }
      }

      // Controlla numero maglia se cambiato
      if (data.jerseyNumber && data.teamId) {
        const existingJersey = await prisma.athlete.findFirst({
          where: {
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            status: AthleteStatus.ACTIVE,
            id: { not: id }
          }
        });

        if (existingJersey) {
          return res.status(409).json({
            success: false,
            error: `Numero maglia ${data.jerseyNumber} già assegnato in questa squadra`
          });
        }
      }

      // Aggiorna l'atleta
      const athlete = await prisma.athlete.update({
        where: { id },
        data,
        include: {
          team: true,
          position: true
        }
      });

      res.json({
        success: true,
        data: athlete,
        message: 'Atleta aggiornato con successo'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Dati non validi',
          details: error.errors
        });
      }

      console.error('Update athlete error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore aggiornamento atleta'
      });
    }
  }

  /**
   * Elimina atleta (soft delete)
   */
  async deleteAthlete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      // Verifica che l'atleta esista
      const athlete = await prisma.athlete.findFirst({
        where: { id, organizationId },
        include: {
          payments: {
            where: {
              status: { in: ['PENDING', 'OVERDUE'] }
            }
          }
        }
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: 'Atleta non trovato'
        });
      }

      // Controlla se ci sono pagamenti in sospeso
      if (athlete.payments.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi eliminare un atleta con pagamenti in sospeso',
          details: {
            pendingPayments: athlete.payments.length
          }
        });
      }

      // Soft delete: imposta lo stato come INACTIVE
      await prisma.athlete.update({
        where: { id },
        data: { 
        status: AthleteStatus.INACTIVE,
          teamId: null // Rimuovi dalla squadra
        }
      });

      res.json({
        success: true,
        message: 'Atleta eliminato con successo'
      });
    } catch (error) {
      console.error('Delete athlete error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore eliminazione atleta'
      });
    }
  }

  /**
   * Ottieni statistiche atleti
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user!.organizationId;

      const [
        totalAthletes,
        activeAthletes,
        athletesByStatus,
        athletesByTeam,
        documentsExpiring,
        paymentsOverdue
      ] = await Promise.all([
        // Totale atleti
        prisma.athlete.count({
          where: { organizationId }
        }),
        // Atleti attivi
        prisma.athlete.count({
          where: { organizationId, status: AthleteStatus.ACTIVE }
        }),
        // Atleti per stato
        prisma.athlete.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true
        }),
        // Atleti per squadra
        prisma.athlete.groupBy({
          by: ['teamId'],
          where: { organizationId, teamId: { not: null } },
          _count: true
        }),
        // Documenti in scadenza
        prisma.document.count({
          where: {
            organizationId,
            status: 'EXPIRING'
          }
        }),
        // Pagamenti in ritardo
        prisma.payment.count({
          where: {
            organizationId,
            status: 'OVERDUE'
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalAthletes,
          activeAthletes,
          inactiveAthletes: totalAthletes - activeAthletes,
          athletesByStatus: athletesByStatus.map(s => ({
            status: s.status,
            count: s._count
          })),
          athletesByTeam: athletesByTeam.map(t => ({
            teamId: t.teamId,
            count: t._count
          })),
          alerts: {
            documentsExpiring,
            paymentsOverdue
          }
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero statistiche'
      });
    }
  }
}

export const athleteService = new AthleteService();
