import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Avvio seed database...');

  // 1. Crea Organization di demo
  const organization = await prisma.organization.upsert({
    where: { taxCode: 'DEMO123456789' },
    update: {},
    create: {
      name: 'ASD Demo Soccer Club',
      taxCode: 'DEMO123456789',
      address: 'Via dello Sport, 1',
      city: 'Milano',
      province: 'MI',
      zipCode: '20100',
      email: 'info@demosoccer.com',
      phone: '+39 02 1234567',
      foundedYear: 2010,
      president: 'Mario Rossi',
      colors: ['Blu', 'Bianco'],
      registrationNumber: 'FIGC-2010-001'
    }
  });

  console.log('✅ Organization creata:', organization.name);

  // 2. Crea Ruoli
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Amministratore con tutti i permessi',
        permissions: ['*:*']
      }
    }),
    prisma.role.upsert({
      where: { name: 'Coach' },
      update: {},
      create: {
        name: 'Coach',
        description: 'Allenatore',
        permissions: [
          'athletes:read',
          'athletes:update',
          'teams:*',
          'matches:*',
          'trainings:*'
        ]
      }
    }),
    prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        description: 'Dirigente',
        permissions: [
          'athletes:*',
          'documents:*',
          'payments:*',
          'reports:read'
        ]
      }
    }),
    prisma.role.upsert({
      where: { name: 'Parent' },
      update: {},
      create: {
        name: 'Parent',
        description: 'Genitore',
        permissions: [
          'athletes:read',
          'documents:read',
          'payments:read',
          'matches:read'
        ]
      }
    })
  ]);

  console.log('✅ Ruoli creati:', roles.length);

  // 3. Crea utente Admin di demo
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'demo@soccermanager.com' },
    update: {},
    create: {
      email: 'demo@soccermanager.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Demo',
      phone: '+39 333 1234567',
      isActive: true,
      emailVerified: true
    }
  });

  // Collega utente all'organizzazione con ruolo Admin
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: organization.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
      roleId: roles[0].id // Admin role
    }
  });

  console.log('✅ Utente Admin creato:', adminUser.email);

  // 4. Crea Posizioni
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { code: 'GK' },
      update: {},
      create: { code: 'GK', name: 'Portiere' }
    }),
    prisma.position.upsert({
      where: { code: 'DEF' },
      update: {},
      create: { code: 'DEF', name: 'Difensore' }
    }),
    prisma.position.upsert({
      where: { code: 'MID' },
      update: {},
      create: { code: 'MID', name: 'Centrocampista' }
    }),
    prisma.position.upsert({
      where: { code: 'ATT' },
      update: {},
      create: { code: 'ATT', name: 'Attaccante' }
    })
  ]);

  console.log('✅ Posizioni create:', positions.length);

  // 5. Crea Tipi Documenti
  const documentTypes = await Promise.all([
    prisma.documentType.upsert({
      where: { code: 'CI' },
      update: {},
      create: {
        code: 'CI',
        name: 'Carta Identità',
        description: 'Documento di identità',
        hasExpiry: true,
        isRequired: true,
        validityDays: 1825 // 5 anni
      }
    }),
    prisma.documentType.upsert({
      where: { code: 'CF' },
      update: {},
      create: {
        code: 'CF',
        name: 'Codice Fiscale',
        description: 'Tessera codice fiscale',
        hasExpiry: false,
        isRequired: true
      }
    }),
    prisma.documentType.upsert({
      where: { code: 'CM' },
      update: {},
      create: {
        code: 'CM',
        name: 'Certificato Medico',
        description: 'Certificato medico sportivo',
        hasExpiry: true,
        isRequired: true,
        validityDays: 365 // 1 anno
      }
    }),
    prisma.documentType.upsert({
      where: { code: 'PRIVACY' },
      update: {},
      create: {
        code: 'PRIVACY',
        name: 'Privacy e Consensi',
        description: 'Modulo privacy e consensi immagine',
        hasExpiry: false,
        isRequired: true
      }
    })
  ]);

  console.log('✅ Tipi Documenti creati:', documentTypes.length);

  // 6. Crea Tipi Pagamento
  const paymentTypes = await Promise.all([
    prisma.paymentType.upsert({
      where: { code: 'REGISTRATION' },
      update: {},
      create: {
        code: 'REGISTRATION',
        name: 'Iscrizione',
        description: 'Quota di iscrizione annuale',
        defaultAmount: 150.00,
        isRecurring: false
      }
    }),
    prisma.paymentType.upsert({
      where: { code: 'MONTHLY' },
      update: {},
      create: {
        code: 'MONTHLY',
        name: 'Retta Mensile',
        description: 'Quota mensile',
        defaultAmount: 50.00,
        isRecurring: true
      }
    }),
    prisma.paymentType.upsert({
      where: { code: 'KIT' },
      update: {},
      create: {
        code: 'KIT',
        name: 'Kit Sportivo',
        description: 'Divisa e materiale sportivo',
        defaultAmount: 80.00,
        isRecurring: false
      }
    })
  ]);

  console.log('✅ Tipi Pagamento creati:', paymentTypes.length);

  // 7. Crea Teams di esempio
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Under 12',
        category: 'U12',
        season: '2024/2025',
        maxPlayers: 20,
        organizationId: organization.id
      }
    }),
    prisma.team.create({
      data: {
        name: 'Under 14',
        category: 'U14',
        season: '2024/2025',
        maxPlayers: 20,
        organizationId: organization.id
      }
    }),
    prisma.team.create({
      data: {
        name: 'Under 16',
        category: 'U16',
        season: '2024/2025',
        maxPlayers: 22,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Teams creati:', teams.length);

  // 8. Crea alcuni atleti di esempio
  const athletes = [];
  const firstNames = ['Marco', 'Luca', 'Giovanni', 'Francesco', 'Alessandro'];
  const lastNames = ['Bianchi', 'Rossi', 'Verdi', 'Esposito', 'Romano'];

  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];

    const athlete = await prisma.athlete.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(2010 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        fiscalCode: `${lastName.toUpperCase().substring(0, 3)}${firstName.toUpperCase().substring(0, 3)}${10 + i}A01H501X`,
        address: `Via Roma ${i + 1}`,
        city: 'Milano',
        province: 'MI',
        zipCode: '20100',
        phone: `+39 333 ${1000000 + i}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        teamId: team.id,
        positionId: position.id,
        jerseyNumber: i + 1,
        status: 'ACTIVE',
        organizationId: organization.id,
        needsTransport: Math.random() > 0.5,
        socialMediaConsent: true,
        imageRightsConsent: true
      }
    });
    athletes.push(athlete);
  }

  console.log('✅ Atleti creati:', athletes.length);

  // 9. Crea alcune zone trasporto
  const transportZones = await Promise.all([
    prisma.transportZone.create({
      data: {
        name: 'Zona Centro',
        description: 'Centro città',
        organizationId: organization.id
      }
    }),
    prisma.transportZone.create({
      data: {
        name: 'Zona Nord',
        description: 'Quartieri nord',
        organizationId: organization.id
      }
    }),
    prisma.transportZone.create({
      data: {
        name: 'Zona Sud',
        description: 'Quartieri sud',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Zone trasporto create:', transportZones.length);

  // 10. Crea competition e venue
  const competition = await prisma.competition.create({
    data: {
      name: 'Campionato Provinciale',
      type: 'CHAMPIONSHIP',
      season: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-05-31'),
      organizationId: organization.id
    }
  });

  const venue = await prisma.venue.create({
    data: {
      name: 'Campo Sportivo Comunale',
      address: 'Via dello Sport, 10',
      city: 'Milano',
      province: 'MI',
      capacity: 500,
      type: 'STANDARD',
      organizationId: organization.id
    }
  });

  console.log('✅ Competition e Venue creati');

  console.log('\n🎉 Seed completato con successo!');
  console.log('\n📧 Credenziali di accesso:');
  console.log('   Email: demo@soccermanager.com');
  console.log('   Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
