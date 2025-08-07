import { PrismaClient, AthleteStatus, DocumentStatus, PaymentStatus, MatchStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper per generare date casuali
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper per generare codice fiscale fittizio
function generateFiscalCode(firstName: string, lastName: string, birthDate: Date): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const randomLetters = () => letters[Math.floor(Math.random() * letters.length)];
  const randomNumbers = () => numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${lastName.substring(0, 3).toUpperCase()}${firstName.substring(0, 3).toUpperCase()}${
    birthDate.getFullYear().toString().substring(2)
  }${randomLetters()}${randomNumbers()}${randomNumbers()}${randomLetters()}${randomNumbers()}${randomNumbers()}${randomNumbers()}${randomLetters()}`;
}

// Lista di nomi italiani comuni
const firstNames = [
  'Marco', 'Luca', 'Alessandro', 'Francesco', 'Matteo', 'Lorenzo', 'Andrea', 'Davide', 'Simone', 'Gabriele',
  'Leonardo', 'Riccardo', 'Giuseppe', 'Antonio', 'Federico', 'Tommaso', 'Edoardo', 'Giorgio', 'Filippo', 'Nicola',
  'Christian', 'Emanuele', 'Pietro', 'Giovanni', 'Stefano', 'Diego', 'Daniele', 'Michele', 'Fabio', 'Roberto',
  'Giacomo', 'Alessio', 'Samuele', 'Cristiano', 'Mattia', 'Luigi', 'Nicolò', 'Giulio', 'Vincenzo', 'Paolo'
];

const lastNames = [
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
  'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone',
  'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'Marchetti', 'Parisi'
];

const cities = [
  'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania',
  'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia', 'Taranto', 'Prato', 'Modena', 'Reggio Calabria'
];

async function main() {
  console.log('🌱 Inizio popolamento completo database...\n');

  try {
    // ========================================
    // 1. ORGANIZZAZIONE PRINCIPALE
    // ========================================
    console.log('📢 Creazione organizzazione...');
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
        phone: '+39 02 1234567',
        website: 'www.calciogiovanile.it'
      }
    });
    console.log('✅ Organizzazione creata:', organization.name);

    // ========================================
    // 2. RUOLI UTENTE
    // ========================================
    console.log('\n👥 Creazione ruoli...');
    const roles = [
      {
        name: 'admin',
        description: 'Amministratore con tutti i permessi',
        permissions: ['*']
      },
      {
        name: 'manager',
        description: 'Responsabile sportivo',
        permissions: [
          'create:athletes', 'read:athletes', 'update:athletes', 'delete:athletes',
          'create:documents', 'read:documents', 'update:documents',
          'create:payments', 'read:payments', 'update:payments',
          'manage:matches', 'manage:trainings', 'manage:teams'
        ]
      },
      {
        name: 'coach',
        description: 'Allenatore',
        permissions: [
          'read:athletes', 'update:athletes',
          'read:documents', 'read:payments',
          'manage:matches', 'manage:trainings'
        ]
      },
      {
        name: 'secretary',
        description: 'Segreteria',
        permissions: [
          'create:athletes', 'read:athletes', 'update:athletes',
          'create:documents', 'read:documents', 'update:documents',
          'create:payments', 'read:payments', 'update:payments'
        ]
      },
      {
        name: 'parent',
        description: 'Genitore',
        permissions: [
          'read:athletes', 'read:documents', 'read:payments', 'read:matches'
        ]
      }
    ];

    const createdRoles: any = {};
    for (const role of roles) {
      createdRoles[role.name] = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }
    console.log('✅ Ruoli creati:', Object.keys(createdRoles).length);

    // ========================================
    // 3. UTENTI DEL SISTEMA
    // ========================================
    console.log('\n👤 Creazione utenti...');
    const users = [
      {
        email: 'admin@soccermanager.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
        roleId: createdRoles.admin.id,
        phone: '+39 333 1111111'
      },
      {
        email: 'direttore@calciogiovanile.it',
        password: 'password123',
        firstName: 'Mario',
        lastName: 'Bianchi',
        roleId: createdRoles.manager.id,
        phone: '+39 333 2222222'
      },
      {
        email: 'segreteria@calciogiovanile.it',
        password: 'password123',
        firstName: 'Laura',
        lastName: 'Verdi',
        roleId: createdRoles.secretary.id,
        phone: '+39 333 3333333'
      },
      {
        email: 'coach.rossi@calciogiovanile.it',
        password: 'password123',
        firstName: 'Giuseppe',
        lastName: 'Rossi',
        roleId: createdRoles.coach.id,
        phone: '+39 333 4444444'
      },
      {
        email: 'coach.neri@calciogiovanile.it',
        password: 'password123',
        firstName: 'Francesco',
        lastName: 'Neri',
        roleId: createdRoles.coach.id,
        phone: '+39 333 5555555'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: hashedPassword,
          organizationId: organization.id,
          isActive: true
        }
      });
      createdUsers.push(user);
    }
    console.log('✅ Utenti creati:', createdUsers.length);

    // ========================================
    // 4. POSIZIONI DI GIOCO
    // ========================================
    console.log('\n⚽ Creazione posizioni di gioco...');
    const positions = [
      { name: 'Portiere', code: 'POR', description: 'Portiere' },
      { name: 'Difensore Centrale', code: 'DC', description: 'Difensore centrale' },
      { name: 'Terzino Destro', code: 'TD', description: 'Terzino destro' },
      { name: 'Terzino Sinistro', code: 'TS', description: 'Terzino sinistro' },
      { name: 'Centrocampista Difensivo', code: 'MED', description: 'Mediano' },
      { name: 'Centrocampista Centrale', code: 'CC', description: 'Centrocampista centrale' },
      { name: 'Centrocampista Offensivo', code: 'TRQ', description: 'Trequartista' },
      { name: 'Ala Destra', code: 'AD', description: 'Ala destra' },
      { name: 'Ala Sinistra', code: 'AS', description: 'Ala sinistra' },
      { name: 'Attaccante Centrale', code: 'ATT', description: 'Attaccante centrale' },
      { name: 'Seconda Punta', code: 'SP', description: 'Seconda punta' }
    ];

    const createdPositions = [];
    for (const position of positions) {
      const created = await prisma.position.upsert({
        where: { code: position.code },
        update: {},
        create: position
      });
      createdPositions.push(created);
    }
    console.log('✅ Posizioni create:', createdPositions.length);

    // ========================================
    // 5. TIPI DI DOCUMENTO
    // ========================================
    console.log('\n📄 Creazione tipi di documento...');
    const documentTypes = [
      { name: 'Certificato Medico Sportivo', description: 'Certificato medico per attività sportiva agonistica', isRequired: true, hasExpiry: true, validityDays: 365 },
      { name: 'Carta Identità', description: 'Documento di identità valido', isRequired: true, hasExpiry: true, validityDays: 3650 },
      { name: 'Tesserino Sanitario', description: 'Tesserino sanitario nazionale', isRequired: true, hasExpiry: true, validityDays: 3650 },
      { name: 'Codice Fiscale', description: 'Codice fiscale', isRequired: true, hasExpiry: false },
      { name: 'Modulo Iscrizione', description: 'Modulo di iscrizione firmato dai genitori', isRequired: true, hasExpiry: false },
      { name: 'Liberatoria Foto/Video', description: 'Autorizzazione riprese foto e video', isRequired: false, hasExpiry: false },
      { name: 'Certificato Vaccinazioni', description: 'Certificato vaccinazioni obbligatorie', isRequired: false, hasExpiry: false },
      { name: 'Delega Ritiro Minore', description: 'Delega per il ritiro del minore', isRequired: false, hasExpiry: false },
      { name: 'Certificato Nascita', description: 'Certificato di nascita', isRequired: false, hasExpiry: false },
      { name: 'Tesseramento FIGC', description: 'Tesseramento federale', isRequired: true, hasExpiry: true, validityDays: 365 }
    ];

    const createdDocTypes = [];
    for (const docType of documentTypes) {
      const created = await prisma.documentType.upsert({
        where: { name: docType.name },
        update: {},
        create: docType
      });
      createdDocTypes.push(created);
    }
    console.log('✅ Tipi documento creati:', createdDocTypes.length);

    // ========================================
    // 6. TIPI DI PAGAMENTO
    // ========================================
    console.log('\n💰 Creazione tipi di pagamento...');
    const paymentTypes = [
      { name: 'Quota Iscrizione', description: 'Quota di iscrizione annuale', amount: 150, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Quota Mensile', description: 'Quota mensile di frequenza', amount: 80, isRecurring: true, frequency: 'MONTHLY' },
      { name: 'Quota Trimestrale', description: 'Quota trimestrale', amount: 220, isRecurring: true, frequency: 'QUARTERLY' },
      { name: 'Kit Abbigliamento Base', description: 'Kit con maglia, pantaloncini e calzettoni', amount: 120, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Kit Allenamento', description: 'Tuta e materiale allenamento', amount: 90, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Assicurazione Integrativa', description: 'Assicurazione sportiva integrativa', amount: 50, isRecurring: false, frequency: 'YEARLY' },
      { name: 'Camp Estivo', description: 'Partecipazione camp estivo', amount: 350, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Torneo', description: 'Iscrizione torneo', amount: 30, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Multa Ritardo', description: 'Penale per ritardo pagamento', amount: 10, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Trasporto Partite', description: 'Contributo trasporto partite fuori casa', amount: 20, isRecurring: false, frequency: 'PER_MATCH' }
    ];

    const createdPaymentTypes = [];
    for (const paymentType of paymentTypes) {
      const created = await prisma.paymentType.upsert({
        where: { name: paymentType.name },
        update: {},
        create: paymentType
      });
      createdPaymentTypes.push(created);
    }
    console.log('✅ Tipi pagamento creati:', createdPaymentTypes.length);

    // ========================================
    // 7. SQUADRE
    // ========================================
    console.log('\n🏆 Creazione squadre...');
    const teams = [
      { name: 'Piccoli Amici 2018', category: 'Piccoli Amici', season: '2024/2025', coach: 'Marco Gentile', assistantCoach: 'Paolo Serra' },
      { name: 'Piccoli Amici 2017', category: 'Piccoli Amici', season: '2024/2025', coach: 'Andrea Martini', assistantCoach: 'Luca Parisi' },
      { name: 'Pulcini 2016', category: 'Pulcini', season: '2024/2025', coach: 'Giuseppe Rossi', assistantCoach: 'Stefano Leone' },
      { name: 'Pulcini 2015', category: 'Pulcini', season: '2024/2025', coach: 'Francesco Neri', assistantCoach: 'Roberto Vitale' },
      { name: 'Pulcini 2014', category: 'Pulcini', season: '2024/2025', coach: 'Antonio Costa', assistantCoach: 'Michele Greco' },
      { name: 'Esordienti 2013', category: 'Esordienti', season: '2024/2025', coach: 'Luigi Verdi', assistantCoach: 'Giovanni Bruno' },
      { name: 'Esordienti 2012', category: 'Esordienti', season: '2024/2025', coach: 'Davide Colombo', assistantCoach: 'Simone Ricci' },
      { name: 'Giovanissimi Under 14', category: 'Giovanissimi', season: '2024/2025', coach: 'Alessandro Ferrari', assistantCoach: 'Matteo Conti' },
      { name: 'Giovanissimi Under 15', category: 'Giovanissimi', season: '2024/2025', coach: 'Lorenzo Romano', assistantCoach: 'Federico Marino' },
      { name: 'Allievi Under 16', category: 'Allievi', season: '2024/2025', coach: 'Gabriele Esposito', assistantCoach: 'Riccardo Bianchi' },
      { name: 'Allievi Under 17', category: 'Allievi', season: '2024/2025', coach: 'Leonardo Russo', assistantCoach: 'Tommaso Gallo' },
      { name: 'Juniores Under 19', category: 'Juniores', season: '2024/2025', coach: 'Edoardo Rizzo', assistantCoach: 'Giorgio Lombardi' }
    ];

    const createdTeams = [];
    for (const team of teams) {
      const created = await prisma.team.create({
        data: {
          ...team,
          organizationId: organization.id
        }
      });
      createdTeams.push(created);
    }
    console.log('✅ Squadre create:', createdTeams.length);

    // ========================================
    // 8. ATLETI (20-25 per squadra)
    // ========================================
    console.log('\n👦 Creazione atleti...');
    let totalAthletes = 0;
    const allAthletes = [];

    for (const team of createdTeams) {
      // Determina l'anno di nascita basato sulla categoria
      let birthYear = 2010;
      if (team.category === 'Piccoli Amici') {
        birthYear = team.name.includes('2018') ? 2018 : 2017;
      } else if (team.category === 'Pulcini') {
        birthYear = parseInt(team.name.match(/\d{4}/)?.[0] || '2015');
      } else if (team.category === 'Esordienti') {
        birthYear = parseInt(team.name.match(/\d{4}/)?.[0] || '2013');
      } else if (team.category === 'Giovanissimi') {
        birthYear = team.name.includes('14') ? 2011 : 2010;
      } else if (team.category === 'Allievi') {
        birthYear = team.name.includes('16') ? 2009 : 2008;
      } else if (team.category === 'Juniores') {
        birthYear = 2006;
      }

      // Crea 20-25 atleti per squadra
      const athletesPerTeam = 20 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < athletesPerTeam; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        // Assegna posizione in base al numero di maglia
        let positionId = createdPositions[Math.floor(Math.random() * createdPositions.length)].id;
        if (i === 0 || i === 12) {
          // Portieri
          positionId = createdPositions.find(p => p.code === 'POR')?.id || positionId;
        } else if (i < 5) {
          // Difensori
          positionId = createdPositions.find(p => ['DC', 'TD', 'TS'].includes(p.code))?.id || positionId;
        } else if (i < 10) {
          // Centrocampisti
          positionId = createdPositions.find(p => ['CC', 'MED', 'TRQ'].includes(p.code))?.id || positionId;
        } else {
          // Attaccanti
          positionId = createdPositions.find(p => ['ATT', 'AD', 'AS', 'SP'].includes(p.code))?.id || positionId;
        }

        const status = Math.random() > 0.95 ? AthleteStatus.INJURED : 
                      Math.random() > 0.98 ? AthleteStatus.SUSPENDED : 
                      Math.random() > 0.92 ? AthleteStatus.INACTIVE : 
                      AthleteStatus.ACTIVE;

        const athlete = await prisma.athlete.create({
          data: {
            firstName,
            lastName,
            birthDate,
            birthPlace: city,
            nationality: 'Italiana',
            fiscalCode: generateFiscalCode(firstName, lastName, birthDate),
            email: Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : undefined,
            phone: Math.random() > 0.5 ? `+39 333 ${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}` : undefined,
            address: `Via ${lastNames[Math.floor(Math.random() * lastNames.length)]}, ${Math.floor(Math.random() * 100) + 1}`,
            city,
            province: city.substring(0, 2).toUpperCase(),
            zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            teamId: team.id,
            positionId,
            jerseyNumber: i + 1,
            status,
            parentName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
            parentPhone: `+39 335 ${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
            parentEmail: `${lastName.toLowerCase()}.famiglia@email.com`,
            medicalNotes: Math.random() > 0.9 ? 'Allergia ai pollini' : 
                         Math.random() > 0.95 ? 'Asma lieve' : 
                         Math.random() > 0.98 ? 'Diabete tipo 1' : undefined,
            allergies: Math.random() > 0.85 ? 'Graminacee' : 
                      Math.random() > 0.9 ? 'Lattosio' : 
                      Math.random() > 0.95 ? 'Glutine' : undefined,
            organizationId: organization.id
          }
        });
        
        allAthletes.push(athlete);
        totalAthletes++;
      }
    }
    console.log('✅ Atleti creati:', totalAthletes);

    // ========================================
    // 9. DOCUMENTI PER ATLETI
    // ========================================
    console.log('\n📋 Creazione documenti atleti...');
    let totalDocuments = 0;
    
    for (const athlete of allAthletes) {
      // Ogni atleta ha almeno i documenti obbligatori
      const requiredDocs = createdDocTypes.filter(dt => dt.isRequired);
      
      for (const docType of requiredDocs) {
        const issueDate = randomDate(new Date(2023, 0, 1), new Date());
        let expiryDate = null;
        let status: DocumentStatus = DocumentStatus.VALID;
        
        if (docType.hasExpiry && docType.validityDays) {
          expiryDate = new Date(issueDate);
          expiryDate.setDate(expiryDate.getDate() + docType.validityDays);
          
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry < 0) {
            status = DocumentStatus.EXPIRED;
          } else if (daysUntilExpiry < 30) {
            status = DocumentStatus.EXPIRING;
          }
        }

        await prisma.document.create({
          data: {
            athleteId: athlete.id,
            typeId: docType.id,
            fileName: `${docType.name.replace(/\s+/g, '_')}_${athlete.lastName}_${athlete.firstName}.pdf`,
            fileUrl: `/documents/${athlete.id}/${docType.id}.pdf`,
            fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
            mimeType: 'application/pdf',
            issueDate,
            expiryDate,
            status,
            uploadedById: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
            isVerified: Math.random() > 0.2,
            verifiedById: Math.random() > 0.2 ? createdUsers[0].id : null,
            verifiedAt: Math.random() > 0.2 ? new Date() : null,
            organizationId: organization.id
          }
        });
        totalDocuments++;
      }
      
      // Alcuni atleti hanno anche documenti opzionali
      if (Math.random() > 0.5) {
        const optionalDocs = createdDocTypes.filter(dt => !dt.isRequired);
        const numOptional = Math.floor(Math.random() * optionalDocs.length);
        
        for (let i = 0; i < numOptional; i++) {
          const docType = optionalDocs[i];
          await prisma.document.create({
            data: {
              athleteId: athlete.id,
              typeId: docType.id,
              fileName: `${docType.name.replace(/\s+/g, '_')}_${athlete.lastName}_${athlete.firstName}.pdf`,
              fileUrl: `/documents/${athlete.id}/${docType.id}.pdf`,
              fileSize: Math.floor(Math.random() * 500000) + 100000,
              mimeType: 'application/pdf',
              issueDate: randomDate(new Date(2023, 0, 1), new Date()),
              status: DocumentStatus.VALID,
              uploadedById: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
              isVerified: Math.random() > 0.3,
              organizationId: organization.id
            }
          });
          totalDocuments++;
        }
      }
    }
    console.log('✅ Documenti creati:', totalDocuments);

    // ========================================
    // 10. PAGAMENTI
    // ========================================
    console.log('\n💳 Creazione pagamenti...');
    let totalPayments = 0;
    
    for (const athlete of allAthletes) {
      // Quota iscrizione
      const inscriptionType = createdPaymentTypes.find(pt => pt.name === 'Quota Iscrizione');
      if (inscriptionType) {
        await prisma.payment.create({
          data: {
            athleteId: athlete.id,
            typeId: inscriptionType.id,
            amount: inscriptionType.amount,
            dueDate: new Date(2024, 8, 30), // Settembre
            paidDate: Math.random() > 0.1 ? randomDate(new Date(2024, 8, 1), new Date(2024, 9, 15)) : null,
            status: Math.random() > 0.1 ? PaymentStatus.PAID : 
                   Math.random() > 0.5 ? PaymentStatus.OVERDUE : PaymentStatus.PENDING,
            paymentMethod: Math.random() > 0.5 ? 'BANK_TRANSFER' : 'CASH',
            transactionId: Math.random() > 0.5 ? `TRX${Math.floor(Math.random() * 1000000)}` : undefined,
            createdById: createdUsers[2].id, // Segreteria
            organizationId: organization.id
          }
        });
        totalPayments++;
      }

      // Quote mensili (ultimi 4 mesi)
      const monthlyType = createdPaymentTypes.find(pt => pt.name === 'Quota Mensile');
      if (monthlyType) {
        for (let month = 0; month < 4; month++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() - month);
          dueDate.setDate(5); // Scadenza il 5 del mese
          
          const isPaid = Math.random() > 0.15; // 85% pagati
          const isOverdue = !isPaid && dueDate < new Date();
          
          await prisma.payment.create({
            data: {
              athleteId: athlete.id,
              typeId: monthlyType.id,
              amount: monthlyType.amount,
              dueDate,
              paidDate: isPaid ? randomDate(dueDate, new Date()) : null,
              status: isPaid ? PaymentStatus.PAID : 
                     isOverdue ? PaymentStatus.OVERDUE : PaymentStatus.PENDING,
              paymentMethod: isPaid ? (Math.random() > 0.6 ? 'BANK_TRANSFER' : 'CASH') : undefined,
              transactionId: isPaid && Math.random() > 0.5 ? `TRX${Math.floor(Math.random() * 1000000)}` : undefined,
              createdById: createdUsers[2].id,
              organizationId: organization.id
            }
          });
          totalPayments++;
        }
      }

      // Kit abbigliamento (50% degli atleti)
      if (Math.random() > 0.5) {
        const kitType = createdPaymentTypes.find(pt => pt.name === 'Kit Abbigliamento Base');
        if (kitType) {
          await prisma.payment.create({
            data: {
              athleteId: athlete.id,
              typeId: kitType.id,
              amount: kitType.amount,
              dueDate: new Date(2024, 9, 15),
              paidDate: Math.random() > 0.2 ? randomDate(new Date(2024, 9, 1), new Date()) : null,
              status: Math.random() > 0.2 ? PaymentStatus.PAID : PaymentStatus.PENDING,
              paymentMethod: Math.random() > 0.4 ? 'CREDIT_CARD' : 'CASH',
              createdById: createdUsers[2].id,
              organizationId: organization.id
            }
          });
          totalPayments++;
        }
      }
    }
    console.log('✅ Pagamenti creati:', totalPayments);

    // ========================================
    // 11. PARTITE
    // ========================================
    console.log('\n⚽ Creazione partite...');
    let totalMatches = 0;
    
    for (const team of createdTeams) {
      // Crea 10-15 partite per squadra
      const numMatches = 10 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < numMatches; i++) {
        const matchDate = randomDate(
          new Date(2024, 8, 1), // Da settembre
          new Date(2025, 5, 30)  // A giugno
        );
        
        const isHome = Math.random() > 0.5;
        const opponentTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)];
        
        // Non giocare contro se stessi
        if (opponentTeam.id === team.id) continue;
        
        const isPast = matchDate < new Date();
        const hasScore = isPast && Math.random() > 0.1;
        
        const match = await prisma.match.create({
          data: {
            homeTeamId: isHome ? team.id : opponentTeam.id,
            awayTeamId: isHome ? opponentTeam.id : team.id,
            date: matchDate,
            time: `${Math.floor(Math.random() * 4) + 15}:${Math.random() > 0.5 ? '00' : '30'}`, // Tra 15:00 e 19:00
            venue: isHome ? 'Campo Sportivo Comunale' : `Campo ${cities[Math.floor(Math.random() * cities.length)]}`,
            competition: Math.random() > 0.7 ? 'Campionato' : 
                        Math.random() > 0.5 ? 'Coppa' : 'Amichevole',
            homeScore: hasScore ? Math.floor(Math.random() * 5) : null,
            awayScore: hasScore ? Math.floor(Math.random() * 5) : null,
            status: !isPast ? MatchStatus.SCHEDULED :
                   hasScore ? MatchStatus.COMPLETED :
                   Math.random() > 0.9 ? MatchStatus.CANCELLED : MatchStatus.POSTPONED,
            notes: Math.random() > 0.7 ? 'Partita importante per la classifica' : undefined,
            organizationId: organization.id
          }
        });
        totalMatches++;

        // Crea convocazioni per le partite
        if (match.status !== MatchStatus.CANCELLED) {
          const teamAthletes = allAthletes.filter(a => 
            a.teamId === team.id && a.status === AthleteStatus.ACTIVE
          );
          
          // Convoca 15-18 giocatori
          const numConvocati = Math.min(teamAthletes.length, 15 + Math.floor(Math.random() * 4));
          const convocati = teamAthletes.slice(0, numConvocati);
          
          for (let j = 0; j < convocati.length; j++) {
            const athlete = convocati[j];
            await prisma.matchRoster.create({
              data: {
                matchId: match.id,
                athleteId: athlete.id,
                isStarter: j < 11, // I primi 11 sono titolari
                attended: isPast ? Math.random() > 0.1 : false // 90% di presenze
              }
            });

            // Se la partita è stata giocata, aggiungi statistiche
            if (hasScore && isPast && Math.random() > 0.3) {
              await prisma.matchStats.create({
                data: {
                  matchId: match.id,
                  athleteId: athlete.id,
                  minutesPlayed: j < 11 ? 60 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 45),
                  goals: Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0,
                  assists: Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0,
                  yellowCards: Math.random() > 0.9 ? 1 : 0,
                  redCards: Math.random() > 0.98 ? 1 : 0
                }
              });
            }
          }
        }
      }
    }
    console.log('✅ Partite create:', totalMatches);

    // ========================================
    // 12. SESSIONI DI ALLENAMENTO
    // ========================================
    console.log('\n🏃 Creazione sessioni di allenamento...');
    let totalTrainings = 0;
    
    for (const team of createdTeams) {
      // Crea allenamenti per le ultime 4 settimane
      for (let week = 0; week < 4; week++) {
        // 2-3 allenamenti a settimana
        const trainingsPerWeek = 2 + Math.floor(Math.random() * 2);
        
        for (let t = 0; t < trainingsPerWeek; t++) {
          const trainingDate = new Date();
          trainingDate.setDate(trainingDate.getDate() - (week * 7) - (t * 3));
          
          const session = await prisma.trainingSession.create({
            data: {
              teamId: team.id,
              date: trainingDate,
              startTime: `${16 + Math.floor(Math.random() * 3)}:${Math.random() > 0.5 ? '00' : '30'}`,
              endTime: `${18 + Math.floor(Math.random() * 2)}:${Math.random() > 0.5 ? '00' : '30'}`,
              location: 'Campo di allenamento principale',
              type: ['TECHNICAL', 'TACTICAL', 'PHYSICAL'][Math.floor(Math.random() * 3)],
              description: ['Esercitazioni tecniche sul possesso palla',
                           'Schemi di gioco e movimenti tattici',
                           'Preparazione fisica e resistenza',
                           'Partitella finale',
                           'Calci piazzati e rigori'][Math.floor(Math.random() * 5)],
              organizationId: organization.id
            }
          });
          totalTrainings++;

          // Registra presenze
          const teamAthletes = allAthletes.filter(a => a.teamId === team.id);
          for (const athlete of teamAthletes) {
            const isPresent = Math.random() > 0.15; // 85% di presenze
            await prisma.trainingAttendance.create({
              data: {
                sessionId: session.id,
                athleteId: athlete.id,
                present: isPresent,
                reason: !isPresent ? ['Malattia', 'Impegni scolastici', 'Infortunio', 'Motivi familiari'][Math.floor(Math.random() * 4)] : undefined
              }
            });
          }
        }
      }
    }
    console.log('✅ Sessioni allenamento create:', totalTrainings);

    // ========================================
    // 13. INFORTUNI
    // ========================================
    console.log('\n🏥 Creazione registro infortuni...');
    let totalInjuries = 0;
    
    // Alcuni atleti hanno avuto infortuni
    const injuredAthletes = allAthletes.filter(() => Math.random() > 0.85); // 15% degli atleti
    
    for (const athlete of injuredAthletes) {
      const injuryDate = randomDate(new Date(2024, 0, 1), new Date());
      const severity = ['MILD', 'MODERATE', 'SEVERE'][Math.floor(Math.random() * 3)];
      const recoveryDays = severity === 'MILD' ? 7 + Math.floor(Math.random() * 7) :
                          severity === 'MODERATE' ? 15 + Math.floor(Math.random() * 15) :
                          30 + Math.floor(Math.random() * 30);
      
      const isRecovered = new Date(injuryDate.getTime() + recoveryDays * 24 * 60 * 60 * 1000) < new Date();
      
      await prisma.injury.create({
        data: {
          athleteId: athlete.id,
          injuryDate,
          description: ['Distorsione caviglia', 'Stiramento muscolare', 'Contusione', 
                       'Elongazione', 'Affaticamento muscolare', 'Trauma contusivo'][Math.floor(Math.random() * 6)],
          severity,
          estimatedRecovery: recoveryDays,
          isRecovered,
          recoveryDate: isRecovered ? new Date(injuryDate.getTime() + recoveryDays * 24 * 60 * 60 * 1000) : null,
          notes: Math.random() > 0.5 ? 'Necessaria fisioterapia' : undefined
        }
      });
      totalInjuries++;
    }
    console.log('✅ Infortuni registrati:', totalInjuries);

    // ========================================
    // RIEPILOGO FINALE
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('✨ POPOLAMENTO DATABASE COMPLETATO!');
    console.log('='.repeat(50));
    console.log(`
📊 RIEPILOGO DATI INSERITI:
   👥 Organizzazioni: 1
   🔐 Ruoli: ${Object.keys(createdRoles).length}
   👤 Utenti: ${createdUsers.length}
   ⚽ Posizioni: ${createdPositions.length}
   📄 Tipi documento: ${createdDocTypes.length}
   💰 Tipi pagamento: ${createdPaymentTypes.length}
   🏆 Squadre: ${createdTeams.length}
   👦 Atleti: ${totalAthletes}
   📋 Documenti: ${totalDocuments}
   💳 Pagamenti: ${totalPayments}
   ⚽ Partite: ${totalMatches}
   🏃 Allenamenti: ${totalTrainings}
   🏥 Infortuni: ${totalInjuries}

📝 CREDENZIALI DI ACCESSO:
   
   ADMIN:
   Email: admin@soccermanager.com
   Password: admin123
   
   DIRETTORE SPORTIVO:
   Email: direttore@calciogiovanile.it
   Password: password123
   
   SEGRETERIA:
   Email: segreteria@calciogiovanile.it
   Password: password123

🚀 Il sistema è pronto per essere utilizzato!
   Avvia il server con: npm run dev
   Accedi a: http://localhost:3000
`);

  } catch (error) {
    console.error('\n❌ Errore durante il popolamento:', error);
    throw error;
  }
}

// Esegui lo script
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
