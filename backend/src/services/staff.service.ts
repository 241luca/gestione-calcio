// backend/src/services/staff.service.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { ResponseFormatter } from '../utils/responseFormatter';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Tipi di ruolo staff
export enum StaffRole {
  COACH = 'COACH',
  ASSISTANT_COACH = 'ASSISTANT_COACH',
  MEDICAL = 'MEDICAL',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  SECRETARY = 'SECRETARY',
  OTHER = 'OTHER'
}

// Tipi di contratto
export enum ContractType {
  EMPLOYEE = 'EMPLOYEE',
  CONTRACTOR = 'CONTRACTOR',
  VOLUNTEER = 'VOLUNTEER'
}

// Stato staff
export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  fiscalCode?: string;
  birthDate?: Date;
  birthPlace?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  staffRole: StaffRole;
  qualification?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: Date;
  specialization?: string;
  contractType?: ContractType;
  contractStart?: Date;
  contractEnd?: Date;
  salary?: number;
  paymentFrequency?: string;
  teamIds?: string[];
  primaryTeamId?: string;
  canAccessSystem?: boolean;
  canManageAthletes?: boolean;
  canManagePayments?: boolean;
  canManageDocuments?: boolean;
  canViewReports?: boolean;
  canSendNotifications?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  profilePhoto?: string;
  notes?: string;
  createUser?: boolean;
  userPassword?: string;
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {
  status?: StaffStatus;
}

export interface StaffFilters {
  role?: StaffRole;
  status?: StaffStatus;
  teamId?: string;
  search?: string;
  hasLicense?: boolean;
  contractType?: ContractType;
}

class StaffService {
  /**
   * Recupera lista staff con filtri
   */
  async getStaffMembers(
    organizationId: string,
    filters?: StaffFilters,
    page: number = 1,
    limit: number = 50
  ) {
    const where: any = {
      organizationId,
      deletedAt: null
    };

    // Applica filtri
    if (filters?.role) {
      where.staffRole = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.teamId) {
      where.teamIds = {
        has: filters.teamId
      };
    }

    if (filters?.contractType) {
      where.contractType = filters.contractType;
    }

    if (filters?.hasLicense !== undefined) {
      if (filters.hasLicense) {
        where.licenseNumber = { not: null };
      } else {
        where.licenseNumber = null;
      }
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fiscalCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Esegui query con paginazione
    const [staffMembers, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { staffRole: 'asc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          team: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    // Arricchisci i dati mantenendo tutti i campi originali
    const enrichedStaff = staffMembers.map(member => {
      const enriched = {
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        isLicenseExpired: member.licenseExpiry ? new Date(member.licenseExpiry) < new Date() : false,
        isCriminalCheckExpired: member.criminalCheckExpiry ? new Date(member.criminalCheckExpiry) < new Date() : false,
        isMedicalExpired: member.medicalCertificateExpiry ? new Date(member.medicalCertificateExpiry) < new Date() : false,
        hasIssues: this.checkStaffIssues(member)
      };
      return enriched;
    });

    return {
      staffMembers: enrichedStaff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Recupera singolo membro staff
   */
  async getStaffById(id: string, organizationId: string) {
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      },
      include: {
        team: true
      }
    });

    if (!staff) {
      throw new NotFoundError('Membro staff non trovato');
    }

    // Calcola statistiche
    const stats = await this.calculateStaffStats(id, organizationId);

    return {
      ...staff,
      stats,
      hasIssues: this.checkStaffIssues(staff)
    };
  }

  /**
   * Crea nuovo membro staff
   */
  async createStaff(data: CreateStaffDto, organizationId: string) {
    // Verifica email unica se fornita
    if (data.email) {
      const existing = await prisma.staff.findFirst({
        where: {
          email: data.email,
          organizationId,
          deletedAt: null
        }
      });

      if (existing) {
        throw new ConflictError('Email già in uso');
      }
    }

    // Verifica codice fiscale unico se fornito
    if (data.fiscalCode) {
      const existing = await prisma.staff.findFirst({
        where: {
          fiscalCode: data.fiscalCode,
          organizationId,
          deletedAt: null
        }
      });

      if (existing) {
        throw new ConflictError('Codice fiscale già registrato');
      }
    }

    // Crea utente se richiesto
    let userId = null;
    if (data.createUser && data.email) {
      const hashedPassword = await bcrypt.hash(
        data.userPassword || 'Staff2025!',
        10
      );

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationId,
          roleId: await this.getStaffRoleId(data.staffRole),
          isActive: true
        }
      });

      userId = user.id;
    }

    // Crea membro staff
    const staff = await prisma.staff.create({
      data: {
        id: uuidv4(),
        organizationId,
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        fiscalCode: data.fiscalCode,
        birthDate: data.birthDate,
        birthPlace: data.birthPlace,
        nationality: data.nationality || 'Italiana',
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        province: data.province,
        zipCode: data.zipCode,
        staffRole: data.staffRole,
        qualification: data.qualification,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType,
        licenseExpiry: data.licenseExpiry,
        specialization: data.specialization,
        contractType: data.contractType || ContractType.VOLUNTEER,
        contractStart: data.contractStart,
        contractEnd: data.contractEnd,
        salary: data.salary,
        paymentFrequency: data.paymentFrequency,
        teamIds: data.teamIds || [],
        primaryTeamId: data.primaryTeamId,
        canAccessSystem: data.canAccessSystem || false,
        canManageAthletes: data.canManageAthletes || false,
        canManagePayments: data.canManagePayments || false,
        canManageDocuments: data.canManageDocuments || false,
        canViewReports: data.canViewReports || false,
        canSendNotifications: data.canSendNotifications || false,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        profilePhoto: data.profilePhoto,
        notes: data.notes,
        status: StaffStatus.ACTIVE
      },
      include: {
        team: true
      }
    });

    // Invia notifica di benvenuto se ha email
    if (staff.email) {
      await this.sendWelcomeEmail(staff);
    }

    return staff;
  }

  /**
   * Aggiorna membro staff
   */
  async updateStaff(
    id: string,
    data: UpdateStaffDto,
    organizationId: string
  ) {
    // Verifica esistenza
    const existing = await this.getStaffById(id, organizationId);

    // Verifica email unica se cambiata
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.staff.findFirst({
        where: {
          email: data.email,
          organizationId,
          id: { not: id },
          deletedAt: null
        }
      });

      if (emailExists) {
        throw new ConflictError('Email già in uso');
      }
    }

    // Aggiorna staff
    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        team: true
      }
    });

    // Se lo stato cambia in TERMINATED, disabilita l'utente
    if (data.status === StaffStatus.TERMINATED && existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: false }
      });
    }

    return updated;
  }

  /**
   * Elimina membro staff (soft delete)
   */
  async deleteStaff(id: string, organizationId: string) {
    const staff = await this.getStaffById(id, organizationId);

    // Soft delete
    await prisma.staff.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: StaffStatus.TERMINATED
      }
    });

    // Disabilita utente se esiste
    if (staff.userId) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { isActive: false }
      });
    }

    return { success: true, message: 'Membro staff eliminato' };
  }

  /**
   * Assegna staff a team
   */
  async assignToTeam(
    staffId: string,
    teamId: string,
    organizationId: string,
    isPrimary: boolean = false
  ) {
    const staff = await this.getStaffById(staffId, organizationId);

    // Verifica che il team esista
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId
      }
    });

    if (!team) {
      throw new NotFoundError('Team non trovato');
    }

    // Aggiungi team all'array
    const teamIds = staff.teamIds || [];
    if (!teamIds.includes(teamId)) {
      teamIds.push(teamId);
    }

    // Aggiorna staff
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        teamIds,
        primaryTeamId: isPrimary ? teamId : staff.primaryTeamId
      },
      include: {
        team: true
      }
    });

    return updated;
  }

  /**
   * Rimuovi staff da team
   */
  async removeFromTeam(
    staffId: string,
    teamId: string,
    organizationId: string
  ) {
    const staff = await this.getStaffById(staffId, organizationId);

    // Rimuovi team dall'array
    const teamIds = (staff.teamIds || []).filter(id => id !== teamId);

    // Se era il team primario, rimuovilo
    const primaryTeamId = staff.primaryTeamId === teamId ? null : staff.primaryTeamId;

    // Aggiorna staff
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        teamIds,
        primaryTeamId
      },
      include: {
        team: true
      }
    });

    return updated;
  }

  /**
   * Aggiorna permessi staff
   */
  async updatePermissions(
    staffId: string,
    permissions: any,
    organizationId: string
  ) {
    await this.getStaffById(staffId, organizationId);

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        canAccessSystem: permissions.canAccessSystem || false,
        canManageAthletes: permissions.canManageAthletes || false,
        canManagePayments: permissions.canManagePayments || false,
        canManageDocuments: permissions.canManageDocuments || false,
        canViewReports: permissions.canViewReports || false,
        canSendNotifications: permissions.canSendNotifications || false,
        permissions: permissions.custom || {}
      }
    });

    return updated;
  }

  /**
   * Rinnova patentino/licenza
   */
  async renewLicense(
    staffId: string,
    licenseData: {
      licenseNumber: string;
      licenseType: string;
      licenseExpiry: Date;
    },
    organizationId: string
  ) {
    await this.getStaffById(staffId, organizationId);

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        licenseNumber: licenseData.licenseNumber,
        licenseType: licenseData.licenseType,
        licenseExpiry: licenseData.licenseExpiry
      }
    });

    return updated;
  }

  /**
   * Aggiorna certificazioni
   */
  async updateCertifications(
    staffId: string,
    certifications: {
      criminalCheck?: {
        date: Date;
        expiry: Date;
      };
      medicalCertificate?: {
        date: Date;
        expiry: Date;
      };
    },
    organizationId: string
  ) {
    await this.getStaffById(staffId, organizationId);

    const updateData: any = {};

    if (certifications.criminalCheck) {
      updateData.hasCriminalCheck = true;
      updateData.criminalCheckDate = certifications.criminalCheck.date;
      updateData.criminalCheckExpiry = certifications.criminalCheck.expiry;
    }

    if (certifications.medicalCertificate) {
      updateData.hasMedicalCertificate = true;
      updateData.medicalCertificateDate = certifications.medicalCertificate.date;
      updateData.medicalCertificateExpiry = certifications.medicalCertificate.expiry;
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: updateData
    });

    return updated;
  }

  /**
   * Ottieni staff per ruolo
   */
  async getStaffByRole(role: StaffRole, organizationId: string) {
    const staff = await prisma.staff.findMany({
      where: {
        organizationId,
        staffRole: role,
        status: StaffStatus.ACTIVE,
        deletedAt: null
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        team: true
      }
    });

    return staff;
  }

  /**
   * Ottieni staff per team
   */
  async getStaffByTeam(teamId: string, organizationId: string) {
    const staff = await prisma.staff.findMany({
      where: {
        organizationId,
        teamIds: {
          has: teamId
        },
        status: StaffStatus.ACTIVE,
        deletedAt: null
      },
      orderBy: [
        { staffRole: 'asc' },
        { lastName: 'asc' }
      ],
      include: {
        team: true
      }
    });

    return staff;
  }

  /**
   * Report staff
   */
  async getStaffReport(organizationId: string) {
    const [
      totalStaff,
      byRole,
      byContract,
      byStatus,
      expiredLicenses,
      expiredCertifications,
      upcomingExpirations
    ] = await Promise.all([
      prisma.staff.count({
        where: {
          organizationId,
          deletedAt: null
        }
      }),
      this.getStaffByRoleCount(organizationId),
      this.getStaffByContractCount(organizationId),
      this.getStaffByStatusCount(organizationId),
      this.getExpiredLicenses(organizationId),
      this.getExpiredCertifications(organizationId),
      this.getUpcomingExpirations(organizationId)
    ]);

    return {
      summary: {
        total: totalStaff,
        active: (byStatus as any)['ACTIVE'] || 0,
        inactive: (byStatus as any)['INACTIVE'] || 0,
        withLicense: await this.countStaffWithLicense(organizationId),
        volunteers: (byContract as any)['VOLUNTEER'] || 0
      },
      byRole,
      byContract,
      byStatus,
      issues: {
        expiredLicenses,
        expiredCertifications,
        upcomingExpirations
      },
      generatedAt: new Date()
    };
  }

  // Helper methods privati
  private checkStaffIssues(staff: any): boolean {
    const now = new Date();
    
    // Controlla scadenze
    if (staff.licenseExpiry && new Date(staff.licenseExpiry) < now) return true;
    if (staff.criminalCheckExpiry && new Date(staff.criminalCheckExpiry) < now) return true;
    if (staff.medicalCertificateExpiry && new Date(staff.medicalCertificateExpiry) < now) return true;
    
    // Controlla stato
    if (staff.status !== StaffStatus.ACTIVE) return true;
    
    return false;
  }

  private async calculateStaffStats(staffId: string, organizationId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [trainingSessions, matches] = await Promise.all([
      prisma.trainingSession.count({
        where: {
          organizationId,
          date: { gte: thirtyDaysAgo }
        }
      }),
      prisma.match.count({
        where: {
          organizationId,
          date: { gte: thirtyDaysAgo }
        }
      })
    ]);

    return {
      recentTrainingSessions: trainingSessions,
      recentMatches: matches,
      totalActivities: trainingSessions + matches
    };
  }

  private async getStaffRoleId(role: StaffRole): Promise<string> {
    // Mappa ruoli staff a ruoli sistema
    const roleMap: Record<StaffRole, string> = {
      [StaffRole.COACH]: 'coach',
      [StaffRole.ASSISTANT_COACH]: 'assistant',
      [StaffRole.MEDICAL]: 'medical',
      [StaffRole.PHYSIOTHERAPIST]: 'medical',
      [StaffRole.MANAGER]: 'manager',
      [StaffRole.DIRECTOR]: 'admin',
      [StaffRole.SECRETARY]: 'secretary',
      [StaffRole.OTHER]: 'staff'
    };

    const systemRole = roleMap[role] || 'staff';
    
    // Cerca o crea il ruolo
    let roleRecord = await prisma.role.findFirst({
      where: { name: systemRole }
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          id: uuidv4(),
          name: systemRole,
          description: `Ruolo ${role}`,
          permissions: []
        }
      });
    }

    return roleRecord.id;
  }

  private async sendWelcomeEmail(staff: any) {
    // Implementazione invio email di benvenuto
    console.log(`Invio email benvenuto a ${staff.email}`);
  }

  private async getStaffByRoleCount(organizationId: string): Promise<Record<string, number>> {
    const result = await prisma.staff.groupBy({
      by: ['staffRole'],
      where: {
        organizationId,
        deletedAt: null
      },
      _count: true
    });

    return result.reduce((acc, item) => ({
      ...acc,
      [item.staffRole ? item.staffRole.toLowerCase() : 'unknown']: item._count
    }), {});
  }

  private async getStaffByContractCount(organizationId: string): Promise<Record<string, number>> {
    const result = await prisma.staff.groupBy({
      by: ['contractType'],
      where: {
        organizationId,
        deletedAt: null
      },
      _count: true
    });

    return result.reduce((acc, item) => ({
      ...acc,
      [item.contractType.toLowerCase()]: item._count
    }), {});
  }

  private async getStaffByStatusCount(organizationId: string): Promise<Record<string, number>> {
    const result = await prisma.staff.groupBy({
      by: ['status'],
      where: {
        organizationId,
        deletedAt: null
      },
      _count: true
    });

    return result.reduce((acc, item) => ({
      ...acc,
      [item.status.toLowerCase()]: item._count
    }), {});
  }

  private async getExpiredLicenses(organizationId: string) {
    return await prisma.staff.count({
      where: {
        organizationId,
        licenseExpiry: {
          lt: new Date()
        },
        deletedAt: null
      }
    });
  }

  private async getExpiredCertifications(organizationId: string) {
    const now = new Date();
    
    return await prisma.staff.count({
      where: {
        organizationId,
        OR: [
          { criminalCheckExpiry: { lt: now } },
          { medicalCertificateExpiry: { lt: now } }
        ],
        deletedAt: null
      }
    });
  }

  private async getUpcomingExpirations(organizationId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    return await prisma.staff.count({
      where: {
        organizationId,
        OR: [
          {
            licenseExpiry: {
              gte: now,
              lte: thirtyDaysFromNow
            }
          },
          {
            criminalCheckExpiry: {
              gte: now,
              lte: thirtyDaysFromNow
            }
          },
          {
            medicalCertificateExpiry: {
              gte: now,
              lte: thirtyDaysFromNow
            }
          }
        ],
        deletedAt: null
      }
    });
  }

  private async countStaffWithLicense(organizationId: string) {
    return await prisma.staff.count({
      where: {
        organizationId,
        licenseNumber: { not: null },
        deletedAt: null
      }
    });
  }
}

export default new StaffService();
