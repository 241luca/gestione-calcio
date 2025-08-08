// backend/src/seeds/staff.seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function seedStaff(organizationId: string) {
  console.log('🌱 Seeding staff members...');

  const staffMembers = [
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Marco',
      lastName: 'Rossi',
      fiscalCode: 'RSSMRC75L15H501Z',
      birthDate: new Date('1975-07-15'),
      birthPlace: 'Roma',
      email: 'marco.rossi@soccermanager.com',
      phone: '+39 06 12345678',
      mobile: '+39 333 1234567',
      address: 'Via Roma 123',
      city: 'Roma',
      province: 'RM',
      zipCode: '00100',
      staffRole: 'COACH',
      qualification: 'Allenatore UEFA A',
      licenseNumber: 'UEFA-A-2020-1234',
      licenseType: 'UEFA A',
      licenseExpiry: new Date('2025-12-31'),
      specialization: 'Settore giovanile',
      contractType: 'EMPLOYEE',
      contractStart: new Date('2023-07-01'),
      contractEnd: new Date('2026-06-30'),
      salary: 35000,
      paymentFrequency: 'MONTHLY',
      canAccessSystem: true,
      canManageAthletes: true,
      canManagePayments: false,
      canManageDocuments: true,
      canViewReports: true,
      canSendNotifications: true,
      hasCriminalCheck: true,
      criminalCheckDate: new Date('2023-06-01'),
      criminalCheckExpiry: new Date('2026-06-01'),
      hasMedicalCertificate: true,
      medicalCertificateDate: new Date('2024-09-01'),
      medicalCertificateExpiry: new Date('2025-09-01'),
      emergencyContact: 'Maria Rossi',
      emergencyPhone: '+39 333 9876543',
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Luigi',
      lastName: 'Bianchi',
      fiscalCode: 'BNCLGU80A01H501X',
      birthDate: new Date('1980-01-01'),
      birthPlace: 'Milano',
      email: 'luigi.bianchi@soccermanager.com',
      phone: '+39 02 87654321',
      mobile: '+39 339 8765432',
      staffRole: 'ASSISTANT_COACH',
      qualification: 'Allenatore UEFA B',
      licenseNumber: 'UEFA-B-2021-5678',
      licenseType: 'UEFA B',
      licenseExpiry: new Date('2026-03-31'),
      contractType: 'EMPLOYEE',
      contractStart: new Date('2024-01-01'),
      salary: 25000,
      paymentFrequency: 'MONTHLY',
      canAccessSystem: true,
      canManageAthletes: true,
      canManageDocuments: true,
      canViewReports: true,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Anna',
      lastName: 'Verdi',
      fiscalCode: 'VRDNNA85M45H501Y',
      birthDate: new Date('1985-08-05'),
      birthPlace: 'Napoli',
      email: 'anna.verdi@soccermanager.com',
      mobile: '+39 340 1234567',
      staffRole: 'PHYSIOTHERAPIST',
      qualification: 'Fisioterapista Sportivo',
      licenseNumber: 'FT-2020-9012',
      licenseType: 'Albo Fisioterapisti',
      licenseExpiry: new Date('2025-06-30'),
      specialization: 'Riabilitazione sportiva',
      contractType: 'CONTRACTOR',
      contractStart: new Date('2024-03-01'),
      salary: 30000,
      paymentFrequency: 'MONTHLY',
      canAccessSystem: true,
      canManageAthletes: false,
      canManageDocuments: true,
      canViewReports: false,
      hasMedicalCertificate: true,
      medicalCertificateDate: new Date('2024-08-01'),
      medicalCertificateExpiry: new Date('2025-08-01'),
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Giuseppe',
      lastName: 'Gialli',
      fiscalCode: 'GLLGPP70R10H501W',
      birthDate: new Date('1970-10-10'),
      birthPlace: 'Torino',
      email: 'giuseppe.gialli@soccermanager.com',
      staffRole: 'MANAGER',
      contractType: 'VOLUNTEER',
      canAccessSystem: true,
      canManageAthletes: true,
      canManagePayments: true,
      canManageDocuments: true,
      canViewReports: true,
      canSendNotifications: true,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Elena',
      lastName: 'Neri',
      fiscalCode: 'NRELNE90D50H501V',
      birthDate: new Date('1990-04-10'),
      birthPlace: 'Firenze',
      email: 'elena.neri@soccermanager.com',
      mobile: '+39 347 9876543',
      staffRole: 'SECRETARY',
      contractType: 'EMPLOYEE',
      contractStart: new Date('2023-09-01'),
      salary: 22000,
      paymentFrequency: 'MONTHLY',
      canAccessSystem: true,
      canManageAthletes: true,
      canManagePayments: true,
      canManageDocuments: true,
      canViewReports: true,
      canSendNotifications: false,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      organizationId,
      firstName: 'Roberto',
      lastName: 'Blu',
      fiscalCode: 'BLURBT88C15H501U',
      birthDate: new Date('1988-03-15'),
      email: 'roberto.blu@soccermanager.com',
      staffRole: 'MEDICAL',
      qualification: 'Medico Sportivo',
      licenseNumber: 'MD-2019-3456',
      licenseType: 'Ordine dei Medici',
      licenseExpiry: new Date('2025-12-31'),
      specialization: 'Medicina dello sport',
      contractType: 'CONTRACTOR',
      canAccessSystem: true,
      canManageAthletes: false,
      canManageDocuments: true,
      canViewReports: false,
      hasCriminalCheck: true,
      criminalCheckDate: new Date('2024-01-01'),
      criminalCheckExpiry: new Date('2027-01-01'),
      status: 'ACTIVE'
    }
  ];

  // Crea utenti per staff che possono accedere al sistema
  for (const staff of staffMembers) {
    if (staff.canAccessSystem && staff.email) {
      try {
        // Crea utente
        const hashedPassword = await bcrypt.hash('Staff2025!', 10);
        
        const user = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: staff.email,
            password: hashedPassword,
            firstName: staff.firstName,
            lastName: staff.lastName,
            organizationId,
            isActive: true
          }
        });

        // Aggiungi userId allo staff
        staff.userId = user.id;
        
        console.log(`✅ Creato utente per ${staff.firstName} ${staff.lastName}`);
      } catch (error) {
        console.log(`⚠️ Utente per ${staff.email} potrebbe già esistere`);
      }
    }

    // Crea membro staff
    try {
      await prisma.staff.create({
        data: staff
      });
      
      console.log(`✅ Creato staff: ${staff.firstName} ${staff.lastName} (${staff.staffRole})`);
    } catch (error) {
      console.log(`⚠️ Staff ${staff.firstName} ${staff.lastName} potrebbe già esistere`);
    }
  }

  console.log('✅ Staff seeding completato!');
  
  return staffMembers;
}

// Funzione per eseguire il seed
export async function runStaffSeed() {
  try {
    // Ottieni la prima organizzazione
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata. Crea prima un\'organizzazione.');
      return;
    }

    await seedStaff(organization.id);
    
    console.log('🎉 Seed staff completato con successo!');
  } catch (error) {
    console.error('❌ Errore durante il seed dello staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  runStaffSeed();
}
