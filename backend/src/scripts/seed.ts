import { PrismaClient, AthleteStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inizio seed database...');

  try {
    // 1. Crea organizzazione di default
    const organization = await prisma.organization.upsert({
      where: { taxCode: 'TEST123456789' },
      update: {},
      create: {
        name: 'ASD Calcio Giovanile Milano',
        taxCode: 'TEST123456789',
        address: 'Via dello Sport, 10',
        city: 'Milano',
        province: 'MI',
        zipCode: '20100',
        email: 'info@calciogiovanile.it',
        phone: '+39 02 1234567'
      }
    });
    console.log('✅ Organizzazione creata:', organization.name);

    // 2. Crea ruoli
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Amministratore con tutti i permessi',
        permissions: ['*']
      }
    });

    const coachRole = await prisma.role.upsert({
      where: { name: 'coach' },
      update: {},
      create: {
        name: 'coach',
        description: 'Allenatore',
        permissions: [
          'read:athletes',
          'update:athletes',
          'read:documents',
          'read:payments',
          'manage:matches',
          'manage:trainings'
        ]
      }
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Utente standard',
        permissions: [
          'read:athletes',
          'read:documents',
          'read:payments'
        ]
      }
    });
    console.log('✅ Ruoli creati');

    // 3. Crea utente admin di default
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@soccermanager.com' },
      update: {},
      create: {
        email: 'admin@soccermanager.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        roleId: adminRole.id,
        organizationId: organization.id,
        isActive: true
      }
    });
    console.log('✅ Utente admin creato - Email: admin@soccermanager.com, Password: admin123');

    // 4. Crea posizioni di gioco
    const positions = [
      { name: 'Portiere', code: 'POR', description: 'Portiere' },
      { name: 'Difensore Centrale', code: 'DC', description: 'Difensore centrale' },
      { name: 'Terzino Destro', code: 'TD', description: 'Terzino destro' },
      { name: 'Terzino Sinistro', code: 'TS', description: 'Terzino sinistro' },
      { name: 'Centrocampista Centrale', code: 'CC', description: 'Centrocampista centrale' },
      { name: 'Mediano', code: 'MED', description: 'Mediano' },
      { name: 'Trequartista', code: 'TRQ', description: 'Trequartista' },
      { name: 'Ala Destra', code: 'AD', description: 'Ala destra' },
      { name: 'Ala Sinistra', code: 'AS', description: 'Ala sinistra' },
      { name: 'Attaccante', code: 'ATT', description: 'Attaccante centrale' }
    ];

    for (const position of positions) {
      await prisma.position.upsert({
        where: { code: position.code },
        update: {},
        create: position
      });
    }
    console.log('✅ Posizioni di gioco create');

    // 5. Crea tipi di documento
    const documentTypes = [
      { name: 'Certificato Medico', description: 'Certificato medico sportivo', isRequired: true, hasExpiry: true, validityDays: 365 },
      { name: 'Carta Identità', description: 'Documento di identità', isRequired: true, hasExpiry: true, validityDays: 3650 },
      { name: 'Tesserino Sanitario', description: 'Tesserino sanitario', isRequired: true, hasExpiry: true, validityDays: 3650 },
      { name: 'Modulo Iscrizione', description: 'Modulo di iscrizione firmato', isRequired: true, hasExpiry: false },
      { name: 'Liberatoria Foto', description: 'Liberatoria per foto/video', isRequired: false, hasExpiry: false },
      { name: 'Certificato Vaccinazioni', description: 'Certificato vaccinazioni', isRequired: false, hasExpiry: false }
    ];

    for (const docType of documentTypes) {
      await prisma.documentType.upsert({
        where: { name: docType.name },
        update: {},
        create: docType
      });
    }
    console.log('✅ Tipi di documento creati');

    // 6. Crea tipi di pagamento
    const paymentTypes = [
      { name: 'Quota Iscrizione', description: 'Quota di iscrizione annuale', amount: 150, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Quota Mensile', description: 'Quota mensile', amount: 80, isRecurring: true, frequency: 'MONTHLY' },
      { name: 'Kit Abbigliamento', description: 'Kit abbigliamento ufficiale', amount: 120, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Assicurazione', description: 'Assicurazione sportiva', amount: 50, isRecurring: false, frequency: 'YEARLY' }
    ];

    for (const paymentType of paymentTypes) {
      await prisma.paymentType.upsert({
        where: { name: paymentType.name },
        update: {},
        create: paymentType
      });
    }
    console.log('✅ Tipi di pagamento creati');

    // 7. Crea squadre di esempio
    const teams = [
      { name: 'Under 10', category: 'Under 10', season: '2024/2025', coach: 'Mario Rossi', organizationId: organization.id },
      { name: 'Under 12', category: 'Under 12', season: '2024/2025', coach: 'Luigi Verdi', organizationId: organization.id },
      { name: 'Under 14', category: 'Under 14', season: '2024/2025', coach: 'Giuseppe Bianchi', organizationId: organization.id },
      { name: 'Under 16', category: 'Under 16', season: '2024/2025', coach: 'Francesco Neri', organizationId: organization.id }
    ];

    const createdTeams = [];
    for (const team of teams) {
      const created = await prisma.team.create({ data: team });
      createdTeams.push(created);
    }
    console.log('✅ Squadre create');

    // 8. Crea alcuni atleti di esempio
    const athletes = [
      {
        firstName: 'Marco',
        lastName: 'Rossi',
        birthDate: new Date('2014-03-15'),
        birthPlace: 'Milano',
        fiscalCode: 'RSSMRC14C15F205X',
        teamId: createdTeams[0].id, // Under 10
        positionId: (await prisma.position.findFirst({ where: { code: 'ATT' } }))?.id,
        jerseyNumber: 9,
        status: AthleteStatus.ACTIVE,
        parentName: 'Giovanni Rossi',
        parentPhone: '+39 333 1234567',
        parentEmail: 'giovanni.rossi@email.com',
        organizationId: organization.id
      },
      {
        firstName: 'Luca',
        lastName: 'Bianchi',
        birthDate: new Date('2014-07-22'),
        birthPlace: 'Roma',
        fiscalCode: 'BNCLCU14L22H501X',
        teamId: createdTeams[0].id, // Under 10
        positionId: (await prisma.position.findFirst({ where: { code: 'CC' } }))?.id,
        jerseyNumber: 8,
        status: AthleteStatus.ACTIVE,
        parentName: 'Maria Bianchi',
        parentPhone: '+39 335 9876543',
        parentEmail: 'maria.bianchi@email.com',
        organizationId: organization.id
      },
      {
        firstName: 'Alessandro',
        lastName: 'Verdi',
        birthDate: new Date('2012-01-10'),
        birthPlace: 'Napoli',
        fiscalCode: 'VRDLSN12A10F839X',
        teamId: createdTeams[1].id, // Under 12
        positionId: (await prisma.position.findFirst({ where: { code: 'POR' } }))?.id,
        jerseyNumber: 1,
        status: AthleteStatus.ACTIVE,
        parentName: 'Antonio Verdi',
        parentPhone: '+39 339 5551234',
        parentEmail: 'antonio.verdi@email.com',
        organizationId: organization.id
      }
    ];

    for (const athlete of athletes) {
      await prisma.athlete.create({ data: athlete });
    }
    console.log('✅ Atleti di esempio creati');

    console.log('\n✨ Seed completato con successo!');
    console.log('\n📝 Credenziali di accesso:');
    console.log('   Email: admin@soccermanager.com');
    console.log('   Password: admin123');
    console.log('\n🚀 Puoi ora avviare il server con: npm run dev');

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
