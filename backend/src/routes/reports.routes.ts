// backend/src/routes/reports.routes.ts
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/reports/stats
 * Statistiche generali
 */
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;

    const [
      totalAthletes,
      activeAthletes,
      totalTeams,
      totalDocuments,
      expiringDocuments,
      totalPayments,
      overduePayments,
      monthlyRevenue
    ] = await Promise.all([
      // Totale atleti
      prisma.athlete.count({
        where: { organizationId }
      }),
      // Atleti attivi
      prisma.athlete.count({
        where: { organizationId, status: 'ACTIVE' }
      }),
      // Totale squadre
      prisma.team.count({
        where: { organizationId }
      }),
      // Totale documenti
      prisma.document.count({
        where: { organizationId }
      }),
      // Documenti in scadenza
      prisma.document.count({
        where: { 
          organizationId,
          status: 'EXPIRING'
        }
      }),
      // Totale pagamenti
      prisma.payment.count({
        where: { organizationId }
      }),
      // Pagamenti scaduti
      prisma.payment.count({
        where: { 
          organizationId,
          status: 'OVERDUE'
        }
      }),
      // Ricavi del mese corrente
      prisma.payment.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          paidDate: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date())
          }
        },
        _sum: {
          paidAmount: true
        }
      })
    ]);

    const stats = {
      athletes: {
        total: totalAthletes,
        active: activeAthletes,
        inactive: totalAthletes - activeAthletes
      },
      teams: {
        total: totalTeams
      },
      documents: {
        total: totalDocuments,
        expiring: expiringDocuments
      },
      payments: {
        total: totalPayments,
        overdue: overduePayments,
        monthlyRevenue: monthlyRevenue._sum.paidAmount || 0
      }
    };

    res.json(ResponseFormatter.success(stats));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/charts
 * Dati per grafici dashboard
 */
router.get('/charts', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { period = 'month' } = req.query;

    // Calcola periodo di riferimento
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    // Ricavi per mese
    const revenueData = await prisma.payment.groupBy({
      by: ['paidDate'],
      where: {
        organizationId,
        status: 'PAID',
        paidDate: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        paidAmount: true
      }
    });

    // Atleti per categoria
    const athletesByCategory = await prisma.athlete.groupBy({
      by: ['teamId'],
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      _count: true
    });

    // Recupera i nomi dei team
    const teams = await prisma.team.findMany({
      where: { organizationId },
      select: { id: true, name: true, category: true }
    });
    const teamMap = new Map(teams.map(t => [t.id, t]));

    // Documenti per stato
    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    // Pagamenti per stato
    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    const charts = {
      revenue: {
        label: 'Ricavi nel tempo',
        data: revenueData.map(r => ({
          date: r.paidDate,
          amount: r._sum.paidAmount || 0
        }))
      },
      athletesByTeam: {
        label: 'Atleti per squadra',
        data: athletesByCategory.map(a => ({
          teamId: a.teamId,
          teamName: teamMap.get(a.teamId || '')?.name || 'Senza squadra',
          category: teamMap.get(a.teamId || '')?.category || 'N/A',
          count: a._count
        }))
      },
      documentStatus: {
        label: 'Stato documenti',
        data: documentsByStatus.map(d => ({
          status: d.status,
          count: d._count
        }))
      },
      paymentStatus: {
        label: 'Stato pagamenti',
        data: paymentsByStatus.map(p => ({
          status: p.status,
          count: p._count
        }))
      }
    };

    res.json(ResponseFormatter.success(charts));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/attendance
 * Report presenze allenamenti
 */
router.get('/attendance', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { teamId, startDate, endDate } = req.query;

    const where: any = {
      session: {
        organizationId
      }
    };

    if (teamId) {
      where.session.teamId = teamId;
    }

    if (startDate || endDate) {
      where.session.date = {};
      if (startDate) {
        where.session.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.session.date.lte = new Date(endDate as string);
      }
    }

    const attendances = await prisma.trainingAttendance.findMany({
      where,
      include: {
        athlete: true,
        session: {
          include: {
            team: true
          }
        }
      },
      orderBy: {
        session: {
          date: 'desc'
        }
      }
    });

    // Calcola statistiche per atleta
    const athleteStats = new Map<string, any>();

    attendances.forEach(att => {
      const key = att.athleteId;
      if (!athleteStats.has(key)) {
        athleteStats.set(key, {
          athleteId: att.athleteId,
          athleteName: `${att.athlete.firstName} ${att.athlete.lastName}`,
          totalSessions: 0,
          presentSessions: 0,
          absentSessions: 0,
          attendanceRate: 0
        });
      }

      const stats = athleteStats.get(key);
      stats.totalSessions++;
      if (att.present) {
        stats.presentSessions++;
      } else {
        stats.absentSessions++;
      }
      stats.attendanceRate = (stats.presentSessions / stats.totalSessions * 100).toFixed(1);
    });

    const report = {
      period: {
        start: startDate || 'Inizio',
        end: endDate || 'Oggi'
      },
      totalSessions: new Set(attendances.map(a => a.sessionId)).size,
      athleteStats: Array.from(athleteStats.values()).sort((a, b) => 
        parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate)
      ),
      details: attendances
    };

    res.json(ResponseFormatter.success(report));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/payments
 * Report pagamenti dettagliato
 */
router.get('/payments', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { startDate, endDate, status } = req.query;

    const where: any = {
      organizationId
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate as string);
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

    // Calcola statistiche
    const stats = {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalPayments: payments.length,
      paidPayments: 0,
      pendingPayments: 0,
      overduePayments: 0
    };

    payments.forEach(payment => {
      stats.totalAmount += payment.amount;
      
      switch (payment.status) {
        case 'PAID':
          stats.paidAmount += payment.paidAmount || 0;
          stats.paidPayments++;
          break;
        case 'PENDING':
          stats.pendingAmount += payment.amount;
          stats.pendingPayments++;
          break;
        case 'OVERDUE':
          stats.overdueAmount += payment.amount;
          stats.overduePayments++;
          break;
      }
    });

    // Raggruppa per atleta
    const byAthlete = new Map<string, any>();
    
    payments.forEach(payment => {
      const key = payment.athleteId;
      if (!byAthlete.has(key)) {
        byAthlete.set(key, {
          athleteId: payment.athleteId,
          athleteName: `${payment.athlete.firstName} ${payment.athlete.lastName}`,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          payments: []
        });
      }

      const athleteData = byAthlete.get(key);
      athleteData.totalAmount += payment.amount;
      
      if (payment.status === 'PAID') {
        athleteData.paidAmount += payment.paidAmount || 0;
      } else if (payment.status === 'PENDING') {
        athleteData.pendingAmount += payment.amount;
      } else if (payment.status === 'OVERDUE') {
        athleteData.overdueAmount += payment.amount;
      }
      
      athleteData.payments.push(payment);
    });

    const report = {
      period: {
        start: startDate || 'Inizio',
        end: endDate || 'Oggi'
      },
      stats,
      byAthlete: Array.from(byAthlete.values()).sort((a, b) => 
        b.overdueAmount - a.overdueAmount
      ),
      details: payments
    };

    res.json(ResponseFormatter.success(report));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/export
 * Export report in vari formati (da implementare)
 */
router.get('/export', async (req: AuthRequest, res, next) => {
  try {
    const { type, format = 'pdf' } = req.query;

    // TODO: Implementare export PDF/Excel
    // Per ora restituiamo un placeholder

    res.json(ResponseFormatter.success({
      message: 'Export funzionalità in sviluppo',
      requestedType: type,
      requestedFormat: format
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/summary
 * Summary report generale
 */
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const organizationId = req.user!.organizationId;

    // Recupera tutti i dati necessari
    const [organization, teams, recentMatches, upcomingMatches] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId }
      }),
      prisma.team.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              athletes: true
            }
          }
        }
      }),
      prisma.match.findMany({
        where: {
          organizationId,
          status: 'COMPLETED',
          date: {
            gte: subMonths(new Date(), 1)
          }
        },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          homeTeam: true,
          awayTeam: true
        }
      }),
      prisma.match.findMany({
        where: {
          organizationId,
          status: 'SCHEDULED',
          date: {
            gte: new Date()
          }
        },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          homeTeam: true,
          awayTeam: true,
          venue: true
        }
      })
    ]);

    const summary = {
      organization: {
        name: organization?.name,
        city: organization?.city,
        province: organization?.province
      },
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        athletesCount: t._count.athletes
      })),
      recentMatches: recentMatches.map(m => ({
        id: m.id,
        date: m.date,
        homeTeam: m.homeTeam?.name,
        awayTeam: m.awayTeam?.name,
        result: `${m.homeScore || 0} - ${m.awayScore || 0}`
      })),
      upcomingMatches: upcomingMatches.map(m => ({
        id: m.id,
        date: m.date,
        time: m.time,
        homeTeam: m.homeTeam?.name,
        awayTeam: m.awayTeam?.name,
        venue: m.venue?.name
      })),
      generatedAt: new Date()
    };

    res.json(ResponseFormatter.success(summary));
  } catch (error) {
    next(error);
  }
});

export default router;
