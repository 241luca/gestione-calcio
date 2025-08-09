// backend/src/services/training.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { it } from 'date-fns/locale';

const prisma = new PrismaClient();

export class TrainingService {
  /**
   * Crea una nuova sessione di allenamento
   */
  async createTrainingSession(data: {
    organizationId: string;
    teamId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    type?: string;
    location?: string;
    notes?: string;
  }) {
    try {
      // Verifica che il team esista
      const team = await prisma.team.findFirst({
        where: {
          id: data.teamId,
          organizationId: data.organizationId
        }
      });

      if (!team) {
        throw new NotFoundError('Team non trovato');
      }

      const training = await prisma.trainingSession.create({
        data: {
          organizationId: data.organizationId,
          teamId: data.teamId,
          date: new Date(data.date),
          startTime: data.startTime.toISOString(),
          endTime: data.endTime.toISOString(),
          type: data.type || 'Allenamento',
          location: data.location || 'Campo principale',
          notes: data.notes
        },
        include: {
          team: true,
          attendances: {
            include: {
              athlete: true
            }
          }
        }
      });

      return training;
    } catch (error) {
      console.error('Error creating training session:', error);
      throw error;
    }
  }

  /**
   * Recupera tutte le sessioni di allenamento
   */
  async getTrainingSessions(
    organizationId: string,
    filters?: {
      teamId?: string;
      from?: Date;
      to?: Date;
      status?: string;
    }
  ) {
    try {
      const where: any = { organizationId };

      if (filters) {
        if (filters.teamId) where.teamId = filters.teamId;
        if (filters.status) where.status = filters.status;
        if (filters.from || filters.to) {
          where.date = {};
          if (filters.from) where.date.gte = new Date(filters.from);
          if (filters.to) where.date.lte = new Date(filters.to);
        }
      }

      const trainings = await prisma.trainingSession.findMany({
        where,
        include: {
          team: true,
          attendances: {
            include: {
              athlete: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      return trainings;
    } catch (error) {
      console.error('Error getting training sessions:', error);
      throw error;
    }
  }

  /**
   * Recupera le sessioni di allenamento di oggi
   */
  async getTodayTrainingSessions(organizationId: string) {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const trainings = await prisma.trainingSession.findMany({
        where: {
          organizationId,
          date: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        include: {
          team: true,
          attendances: {
            include: {
              athlete: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return trainings;
    } catch (error) {
      console.error('Error getting today training sessions:', error);
      throw error;
    }
  }

  /**
   * Recupera una singola sessione di allenamento
   */
  async getTrainingSessionById(id: string, organizationId: string) {
    try {
      const training = await prisma.trainingSession.findFirst({
        where: { id, organizationId },
        include: {
          team: true,
          attendances: {
            include: {
              athlete: true
            }
          }
        }
      });

      if (!training) {
        throw new NotFoundError('Sessione di allenamento non trovata');
      }

      return training;
    } catch (error) {
      console.error('Error getting training session:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una sessione di allenamento
   */
  async updateTrainingSession(
    id: string,
    organizationId: string,
    data: {
      date?: Date;
      startTime?: Date;
      endTime?: Date;
      type?: string;
      location?: string;
      notes?: string;
    }
  ) {
    try {
      const training = await prisma.trainingSession.findFirst({
        where: { id, organizationId }
      });

      if (!training) {
        throw new NotFoundError('Sessione di allenamento non trovata');
      }

      const updated = await prisma.trainingSession.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          startTime: data.startTime ? data.startTime.toISOString() : undefined,
          endTime: data.endTime ? data.endTime.toISOString() : undefined
        },
        include: {
          team: true,
          attendances: {
            include: {
              athlete: true
            }
          }
        }
      });

      return updated;
    } catch (error) {
      console.error('Error updating training session:', error);
      throw error;
    }
  }

  /**
   * Elimina una sessione di allenamento
   */
  async deleteTrainingSession(id: string, organizationId: string) {
    try {
      const training = await prisma.trainingSession.findFirst({
        where: { id, organizationId }
      });

      if (!training) {
        throw new NotFoundError('Sessione di allenamento non trovata');
      }

      // Elimina prima le presenze associate
      await prisma.trainingAttendance.deleteMany({
        where: { sessionId: id }
      });

      // Poi elimina la sessione
      await prisma.trainingSession.delete({
        where: { id }
      });

      return { success: true, message: 'Sessione di allenamento eliminata con successo' };
    } catch (error) {
      console.error('Error deleting training session:', error);
      throw error;
    }
  }

  /**
   * Registra la presenza degli atleti all'allenamento
   */
  async recordAttendance(
    sessionId: string,
    organizationId: string,
    attendances: Array<{
      athleteId: string;
      present: boolean;
      notes?: string;
    }>
  ) {
    try {
      const session = await prisma.trainingSession.findFirst({
        where: { id: sessionId, organizationId }
      });

      if (!session) {
        throw new NotFoundError('Sessione di allenamento non trovata');
      }

      // Elimina le presenze esistenti
      await prisma.trainingAttendance.deleteMany({
        where: { sessionId }
      });

      // Crea le nuove presenze
      const attendanceRecords = await prisma.trainingAttendance.createMany({
        data: attendances.map(a => ({
          sessionId,
          athleteId: a.athleteId,
          present: a.present,
          notes: a.notes
        }))
      });

      // Recupera la sessione aggiornata
      const updatedSession = await this.getTrainingSessionById(sessionId, organizationId);

      return updatedSession;
    } catch (error) {
      console.error('Error recording attendances:', error);
      throw error;
    }
  }
}
