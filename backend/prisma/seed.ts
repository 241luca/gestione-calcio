import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays, addMonths, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inizio seed database...');

  // 1. ORGANIZZAZIONE PRINCIPALE
  const organization = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'ASD Calcio Milano',
      taxCode: '12345678901',
      address: 'Via dello Sport, 10',
      city: 'Milano',
      zipCode: '20100',
      phone: '+39 02 12345678',
      email: 'info@asdcalciomilano.it',
      website: 'www.asdcalciomilano.it',
      foundedYear: 2010,
      federationNumber: 'MI12345',
      logo: '/logo.png'
    }
  });

  console.log('✅ Organizzazione creata');

  // 2. RUOLI
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'admin',
        description: 'Amministratore completo',
        organizationId: organization.id
      }
    }),
    prisma.role.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'coach',
        description: 'Allenatore',
        organizationId: organization.id
      }
    }),
    prisma.role.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'manager',
        description: 'Dirigente',
        organizationId: organization.id
      }
    }),
    prisma.role.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: 'parent',
        description: 'Genitore',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Ruoli creati');

  // 3. UTENTI
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@soccermanager.com' },
      update: {},
      create: {
        id: 'user-admin',
        email: 'demo@soccermanager.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Demo',
        phone: '+39 333 1234567',
        roleId: 1,
        organizationId: organization.id,
        isActive: true,
        emailVerified: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'mario.rossi@team.com' },
      update: {},
      create: {
        id: 'user-coach-1',
        email: 'mario.rossi@team.com',
        password: hashedPassword,
        firstName: 'Mario',
        lastName: 'Rossi',
        phone: '+39 333 2345678',
        roleId: 2,
        organizationId: organization.id,
        isActive: true,
        emailVerified: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'luigi.verdi@team.com' },
      update: {},
      create: {
        id: 'user-coach-2',
        email: 'luigi.verdi@team.com',
        password: hashedPassword,
        firstName: 'Luigi',
        lastName: 'Verdi',
        phone: '+39 333 3456789',
        roleId: 2,
        organizationId: organization.id,
        isActive: true,
        emailVerified: true
      }
    })
  ]);

  console.log('✅ Utenti creati');

  // 4. POSIZIONI
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Portiere', abbreviation: 'POR' }
    }),
    prisma.position.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'Difensore Centrale', abbreviation: 'DC' }
    }),
    prisma.position.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: 'Terzino Destro', abbreviation: 'TD' }
    }),
    prisma.position.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: 'Terzino Sinistro', abbreviation: 'TS' }
    }),
    prisma.position.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: 'Centrocampista Centrale', abbreviation: 'CC' }
    }),
    prisma.position.upsert({
      where: { id: 6 },
      update: {},
      create: { id: 6, name: 'Centrocampista Esterno', abbreviation: 'CE' }
    }),
    prisma.position.upsert({
      where: { id: 7 },
      update: {},
      create: { id: 7, name: 'Trequartista', abbreviation: 'TRQ' }
    }),
    prisma.position.upsert({
      where: { id: 8 },
      update: {},
      create: { id: 8, name: 'Attaccante', abbreviation: 'ATT' }
    }),
    prisma.position.upsert({
      where: { id: 9 },
      update: {},
      create: { id: 9, name: 'Ala Destra', abbreviation: 'AD' }
    }),
    prisma.position.upsert({
      where: { id: 10 },
      update: {},
      create: { id: 10, name: 'Ala Sinistra', abbreviation: 'AS' }
    })
  ]);

  console.log('✅ Posizioni create');

  // 5. SQUADRE
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { id: 'team-u10' },
      update: {},
      create: {
        id: 'team-u10',
        name: 'Under 10',
        category: 'U10',
        season: '2024/2025',
        coachId: 'user-coach-1',
        organizationId: organization.id
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-u12' },
      update: {},
      create: {
        id: 'team-u12',
        name: 'Under 12',
        category: 'U12',
        season: '2024/2025',
        coachId: 'user-coach-2',
        organizationId: organization.id
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-u14' },
      update: {},
      create: {
        id: 'team-u14',
        name: 'Under 14',
        category: 'U14',
        season: '2024/2025',
        coachId: 'user-coach-1',
        organizationId: organization.id
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-u16' },
      update: {},
      create: {
        id: 'team-u16',
        name: 'Under 16',
        category: 'U16',
        season: '2024/2025',
        coachId: 'user-coach-2',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Squadre create');

  // 6. ZONE TRASPORTO
  const transportZones = await Promise.all([
    prisma.transportZone.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Zona Centro',
        description: 'Milano centro',
        organizationId: organization.id
      }
    }),
    prisma.transportZone.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Zona Nord',
        description: 'Milano nord e hinterland',
        organizationId: organization.id
      }
    }),
    prisma.transportZone.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Zona Sud',
        description: 'Milano sud e hinterland',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Zone trasporto create');

  // 7. ATLETI (50 atleti totali)
  const athleteNames = [
    // Under 10 (12 atleti)
    { firstName: 'Marco', lastName: 'Bianchi', birthYear: 2014 },
    { firstName: 'Luca', lastName: 'Rossi', birthYear: 2014 },
    { firstName: 'Alessandro', lastName: 'Ferrari', birthYear: 2015 },
    { firstName: 'Matteo', lastName: 'Romano', birthYear: 2015 },
    { firstName: 'Andrea', lastName: 'Colombo', birthYear: 2014 },
    { firstName: 'Giorgio', lastName: 'Ricci', birthYear: 2015 },
    { firstName: 'Federico', lastName: 'Marino', birthYear: 2014 },
    { firstName: 'Davide', lastName: 'Greco', birthYear: 2015 },
    { firstName: 'Lorenzo', lastName: 'Bruno', birthYear: 2014 },
    { firstName: 'Simone', lastName: 'Gallo', birthYear: 2015 },
    { firstName: 'Riccardo', lastName: 'Conti', birthYear: 2014 },
    { firstName: 'Pietro', lastName: 'De Luca', birthYear: 2015 },
    
    // Under 12 (13 atleti)
    { firstName: 'Giovanni', lastName: 'Mancini', birthYear: 2012 },
    { firstName: 'Francesco', lastName: 'Barbieri', birthYear: 2013 },
    { firstName: 'Antonio', lastName: 'Fontana', birthYear: 2012 },
    { firstName: 'Stefano', lastName: 'Santoro', birthYear: 2013 },
    { firstName: 'Angelo', lastName: 'Mariani', birthYear: 2012 },
    { firstName: 'Roberto', lastName: 'Rinaldi', birthYear: 2013 },
    { firstName: 'Paolo', lastName: 'Caruso', birthYear: 2012 },
    { firstName: 'Sergio', lastName: 'Ferrara', birthYear: 2013 },
    { firstName: 'Emanuele', lastName: 'Gatti', birthYear: 2012 },
    { firstName: 'Fabio', lastName: 'Leone', birthYear: 2013 },
    { firstName: 'Michele', lastName: 'Longo', birthYear: 2012 },
    { firstName: 'Nicola', lastName: 'Martinelli', birthYear: 2013 },
    { firstName: 'Vincenzo', lastName: 'Serra', birthYear: 2012 },
    
    // Under 14 (13 atleti)
    { firstName: 'Christian', lastName: 'Fabbri', birthYear: 2010 },
    { firstName: 'Alberto', lastName: 'Monti', birthYear: 2011 },
    { firstName: 'Daniele', lastName: 'Grassi', birthYear: 2010 },
    { firstName: 'Edoardo', lastName: 'Pellegrini', birthYear: 2011 },
    { firstName: 'Enrico', lastName: 'Lombardi', birthYear: 2010 },
    { firstName: 'Filippo', lastName: 'Moretti', birthYear: 2011 },
    { firstName: 'Gabriele', lastName: 'Amato', birthYear: 2010 },
    { firstName: 'Ivan', lastName: 'Silvestri', birthYear: 2011 },
    { firstName: 'Leonardo', lastName: 'Mazza', birthYear: 2010 },
    { firstName: 'Manuel', lastName: 'Testa', birthYear: 2011 },
    { firstName: 'Nicolò', lastName: 'Villa', birthYear: 2010 },
    { firstName: 'Omar', lastName: 'Rizzi', birthYear: 2011 },
    { firstName: 'Samuele', lastName: 'Costa', birthYear: 2010 },
    
    // Under 16 (12 atleti)
    { firstName: 'Thomas', lastName: 'Giordano', birthYear: 2008 },
    { firstName: 'Valerio', lastName: 'Cattaneo', birthYear: 2009 },
    { firstName: 'Walter', lastName: 'Martino', birthYear: 2008 },
    { firstName: 'Alex', lastName: 'Fiore', birthYear: 2009 },
    { firstName: 'Bryan', lastName: 'Rosa', birthYear: 2008 },
    { firstName: 'Carlo', lastName: 'Esposito', birthYear: 2009 },
    { firstName: 'Diego', lastName: 'Valenti', birthYear: 2008 },
    { firstName: 'Erik', lastName: 'Ferri', birthYear: 2009 },
    { firstName: 'Flavio', lastName: 'Riva', birthYear: 2008 },
    { firstName: 'Gianluca', lastName: 'Morelli', birthYear: 2009 },
    { firstName: 'Hugo', lastName: 'Sala', birthYear: 2008 },
    { firstName: 'Igor', lastName: 'Benedetti', birthYear: 2009 }
  ];

  const athletes = [];
  
  for (let i = 0; i < athleteNames.length; i++) {
    const athlete = athleteNames[i];
    let teamId, positionId;
    
    // Assegna alla squadra in base all'età
    if (i < 12) {
      teamId = 'team-u10';
    } else if (i < 25) {
      teamId = 'team-u12';
    } else if (i < 38) {
      teamId = 'team-u14';
    } else {
      teamId = 'team-u16';
    }
    
    // Assegna posizione (distribuzione realistica)
    if (i % 11 === 0) {
      positionId = 1; // Portiere
    } else if (i % 11 <= 4) {
      positionId = 2 + (i % 3); // Difensori
    } else if (i % 11 <= 7) {
      positionId = 5 + (i % 2); // Centrocampisti
    } else {
      positionId = 8 + (i % 3); // Attaccanti
    }
    
    const createdAthlete = await prisma.athlete.create({
      data: {
        id: `athlete-${i + 1}`,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        birthDate: new Date(`${athlete.birthYear}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`),
        birthPlace: 'Milano',
        nationality: 'Italiana',
        fiscalCode: `${athlete.lastName.substring(0, 3).toUpperCase()}${athlete.firstName.substring(0, 3).toUpperCase()}${athlete.birthYear.toString().substring(2)}A01H501${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        address: `Via ${['Roma', 'Milano', 'Torino', 'Venezia', 'Firenze'][Math.floor(Math.random() * 5)]}, ${Math.floor(Math.random() * 100) + 1}`,
        city: 'Milano',
        zipCode: `201${Math.floor(Math.random() * 90) + 10}`,
        province: 'MI',
        phone: `+39 333 ${Math.floor(Math.random() * 9000000) + 1000000}`,
        email: `${athlete.firstName.toLowerCase()}.${athlete.lastName.toLowerCase()}@email.com`,
        teamId,
        positionId,
        jerseyNumber: (i % 25) + 1,
        footPreference: ['RIGHT', 'LEFT', 'BOTH'][Math.floor(Math.random() * 3)],
        height: 130 + Math.floor(Math.random() * 50),
        weight: 30 + Math.floor(Math.random() * 30),
        status: Math.random() > 0.9 ? 'INJURED' : 'ACTIVE',
        transportZoneId: Math.floor(Math.random() * 3) + 1,
        hasTransportService: Math.random() > 0.5,
        organizationId: organization.id,
        parentName: `${['Giovanni', 'Maria', 'Roberto', 'Anna'][Math.floor(Math.random() * 4)]} ${athlete.lastName}`,
        parentPhone: `+39 335 ${Math.floor(Math.random() * 9000000) + 1000000}`,
        parentEmail: `genitore.${athlete.lastName.toLowerCase()}@email.com`,
        notes: Math.random() > 0.7 ? 'Ottimo potenziale tecnico' : null
      }
    });
    
    athletes.push(createdAthlete);
  }

  console.log(`✅ ${athletes.length} Atleti creati`);

  // 8. TIPI DOCUMENTI
  const documentTypes = await Promise.all([
    prisma.documentType.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Certificato Medico Sportivo',
        description: 'Certificato medico per attività sportiva agonistica',
        isRequired: true,
        hasExpiry: true,
        validityDays: 365,
        organizationId: organization.id
      }
    }),
    prisma.documentType.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Carta Identità',
        description: 'Documento di identità',
        isRequired: true,
        hasExpiry: true,
        validityDays: 3650,
        organizationId: organization.id
      }
    }),
    prisma.documentType.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Tesseramento FIGC',
        description: 'Tessera federale',
        isRequired: true,
        hasExpiry: true,
        validityDays: 365,
        organizationId: organization.id
      }
    }),
    prisma.documentType.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: 'Modulo Privacy',
        description: 'Consenso trattamento dati',
        isRequired: true,
        hasExpiry: false,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Tipi documenti creati');

  // 9. DOCUMENTI (3 per ogni atleta)
  const documents = [];
  for (const athlete of athletes) {
    // Certificato medico
    documents.push(
      await prisma.document.create({
        data: {
          athleteId: athlete.id,
          typeId: 1,
          fileName: `certificato_medico_${athlete.lastName.toLowerCase()}.pdf`,
          fileUrl: `/uploads/certificato_medico_${athlete.id}.pdf`,
          fileSize: Math.floor(Math.random() * 1000000) + 100000,
          mimeType: 'application/pdf',
          issueDate: subMonths(new Date(), 3),
          expiryDate: addMonths(new Date(), 9),
          status: 'VALID',
          isVerified: true,
          uploadedBy: 'user-admin',
          organizationId: organization.id
        }
      })
    );

    // Carta identità
    documents.push(
      await prisma.document.create({
        data: {
          athleteId: athlete.id,
          typeId: 2,
          fileName: `carta_identita_${athlete.lastName.toLowerCase()}.pdf`,
          fileUrl: `/uploads/carta_identita_${athlete.id}.pdf`,
          fileSize: Math.floor(Math.random() * 500000) + 100000,
          mimeType: 'application/pdf',
          issueDate: subMonths(new Date(), 12),
          expiryDate: addMonths(new Date(), 36),
          status: 'VALID',
          isVerified: true,
          uploadedBy: 'user-admin',
          organizationId: organization.id
        }
      })
    );

    // Tesseramento (per alcuni scaduto/in scadenza)
    const tesseramentoExpiry = Math.random() > 0.8 
      ? subDays(new Date(), Math.floor(Math.random() * 30)) // Scaduto
      : Math.random() > 0.6
      ? addDays(new Date(), Math.floor(Math.random() * 30)) // In scadenza
      : addMonths(new Date(), 6); // Valido

    documents.push(
      await prisma.document.create({
        data: {
          athleteId: athlete.id,
          typeId: 3,
          fileName: `tesseramento_${athlete.lastName.toLowerCase()}.pdf`,
          fileUrl: `/uploads/tesseramento_${athlete.id}.pdf`,
          fileSize: Math.floor(Math.random() * 300000) + 50000,
          mimeType: 'application/pdf',
          issueDate: subMonths(new Date(), 6),
          expiryDate: tesseramentoExpiry,
          status: tesseramentoExpiry < new Date() ? 'EXPIRED' : 
                 tesseramentoExpiry < addDays(new Date(), 30) ? 'EXPIRING' : 'VALID',
          isVerified: Math.random() > 0.3,
          uploadedBy: 'user-admin',
          organizationId: organization.id
        }
      })
    );
  }

  console.log(`✅ ${documents.length} Documenti creati`);

  // 10. TIPI PAGAMENTO
  const paymentTypes = await Promise.all([
    prisma.paymentType.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Quota Iscrizione',
        description: 'Iscrizione annuale',
        amount: 150,
        isRecurring: false,
        organizationId: organization.id
      }
    }),
    prisma.paymentType.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Retta Mensile',
        description: 'Quota mensile',
        amount: 80,
        isRecurring: true,
        organizationId: organization.id
      }
    }),
    prisma.paymentType.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Kit Divise',
        description: 'Divise ufficiali',
        amount: 120,
        isRecurring: false,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Tipi pagamento creati');

  // 11. PAGAMENTI (multipli per ogni atleta)
  const payments = [];
  for (const athlete of athletes) {
    // Quota iscrizione (tutti hanno pagato)
    payments.push(
      await prisma.payment.create({
        data: {
          athleteId: athlete.id,
          typeId: 1,
          amount: 150,
          dueDate: subMonths(new Date(), 4),
          paidDate: subMonths(new Date(), 4),
          status: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
          description: 'Quota iscrizione 2024/2025',
          organizationId: organization.id
        }
      })
    );

    // Rette mensili (ultimi 6 mesi)
    for (let month = 5; month >= 0; month--) {
      const dueDate = subMonths(new Date(), month);
      const isPaid = Math.random() > 0.2; // 80% pagati
      const isOverdue = !isPaid && dueDate < subDays(new Date(), 30);
      
      payments.push(
        await prisma.payment.create({
          data: {
            athleteId: athlete.id,
            typeId: 2,
            amount: 80,
            dueDate,
            paidDate: isPaid ? addDays(dueDate, Math.floor(Math.random() * 10)) : null,
            status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING',
            paymentMethod: isPaid ? ['BANK_TRANSFER', 'CASH', 'CREDIT_CARD'][Math.floor(Math.random() * 3)] : null,
            description: `Retta ${dueDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`,
            organizationId: organization.id
          }
        })
      );
    }

    // Kit divise (70% hanno comprato)
    if (Math.random() > 0.3) {
      payments.push(
        await prisma.payment.create({
          data: {
            athleteId: athlete.id,
            typeId: 3,
            amount: 120,
            dueDate: subMonths(new Date(), 3),
            paidDate: subMonths(new Date(), 3),
            status: 'PAID',
            paymentMethod: 'CASH',
            description: 'Kit divise stagione 2024/2025',
            organizationId: organization.id
          }
        })
      );
    }
  }

  console.log(`✅ ${payments.length} Pagamenti creati`);

  // 12. COMPETIZIONI
  const competitions = await Promise.all([
    prisma.competition.create({
      data: {
        id: 'comp-1',
        name: 'Campionato Provinciale U10',
        type: 'CAMPIONATO',
        season: '2024/2025',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2025-05-30'),
        description: 'Campionato provinciale categoria Under 10',
        organizationId: organization.id
      }
    }),
    prisma.competition.create({
      data: {
        id: 'comp-2',
        name: 'Campionato Provinciale U12',
        type: 'CAMPIONATO',
        season: '2024/2025',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2025-05-30'),
        organizationId: organization.id
      }
    }),
    prisma.competition.create({
      data: {
        id: 'comp-3',
        name: 'Coppa Lombardia U14',
        type: 'COPPA',
        season: '2024/2025',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-04-30'),
        organizationId: organization.id
      }
    }),
    prisma.competition.create({
      data: {
        id: 'comp-4',
        name: 'Torneo di Natale',
        type: 'TORNEO',
        season: '2024/2025',
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-23'),
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Competizioni create');

  // 13. VENUE (Campi da gioco)
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        id: 1,
        name: 'Campo Principale',
        address: 'Via dello Sport, 10',
        city: 'Milano',
        type: 'HOME',
        capacity: 500,
        hasLighting: true,
        surface: 'ERBA_SINTETICA',
        organizationId: organization.id
      }
    }),
    prisma.venue.create({
      data: {
        id: 2,
        name: 'Campo Secondario',
        address: 'Via dello Sport, 10',
        city: 'Milano',
        type: 'HOME',
        capacity: 200,
        hasLighting: false,
        surface: 'ERBA_NATURALE',
        organizationId: organization.id
      }
    }),
    prisma.venue.create({
      data: {
        id: 3,
        name: 'Centro Sportivo Comunale',
        address: 'Via Roma, 25',
        city: 'Milano',
        type: 'AWAY',
        capacity: 1000,
        hasLighting: true,
        surface: 'ERBA_SINTETICA',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Campi da gioco creati');

  // 14. PARTITE
  const matches = [];
  const matchTypes = ['CAMPIONATO', 'COPPA', 'AMICHEVOLE', 'TORNEO'];
  
  for (const team of teams) {
    // Crea 10 partite per squadra
    for (let i = 0; i < 10; i++) {
      const isHome = Math.random() > 0.5;
      const matchDate = i < 5 
        ? subDays(new Date(), (5 - i) * 7) // Partite passate
        : addDays(new Date(), (i - 4) * 7); // Partite future
      
      const match = await prisma.match.create({
        data: {
          homeTeamId: isHome ? team.id : null,
          awayTeamId: !isHome ? team.id : null,
          opponentName: isHome ? `Squadra Ospite ${i + 1}` : `Squadra Casa ${i + 1}`,
          date: matchDate,
          time: `${14 + Math.floor(Math.random() * 6)}:${['00', '30'][Math.floor(Math.random() * 2)]}`,
          venueId: isHome ? 1 : 3,
          competitionId: competitions[Math.floor(Math.random() * competitions.length)].id,
          matchType: matchTypes[Math.floor(Math.random() * matchTypes.length)],
          status: matchDate < new Date() ? 'COMPLETED' : 'SCHEDULED',
          homeScore: matchDate < new Date() ? Math.floor(Math.random() * 5) : null,
          awayScore: matchDate < new Date() ? Math.floor(Math.random() * 5) : null,
          isHome,
          organizationId: organization.id
        }
      });
      
      matches.push(match);
    }
  }

  console.log(`✅ ${matches.length} Partite create`);

  // 15. CONVOCAZIONI (per partite future)
  const rosters = [];
  for (const match of matches.filter(m => m.status === 'SCHEDULED')) {
    const team = teams.find(t => t.id === match.homeTeamId || t.id === match.awayTeamId);
    if (team) {
      const teamAthletes = athletes.filter(a => a.teamId === team.id && a.status === 'ACTIVE');
      const selectedAthletes = teamAthletes.slice(0, Math.min(15, teamAthletes.length));
      
      for (const athlete of selectedAthletes) {
        rosters.push(
          await prisma.matchRoster.create({
            data: {
              matchId: match.id,
              athleteId: athlete.id,
              isConvocated: true,
              isPresent: null,
              position: athlete.positionId
            }
          })
        );
      }
    }
  }

  console.log(`✅ ${rosters.length} Convocazioni create`);

  // 16. ALLENAMENTI
  const trainingSessions = [];
  for (const team of teams) {
    // Crea 20 sessioni di allenamento per squadra
    for (let i = 0; i < 20; i++) {
      const sessionDate = subDays(new Date(), 30 - i);
      
      const session = await prisma.trainingSession.create({
        data: {
          teamId: team.id,
          date: sessionDate,
          startTime: '17:00',
          endTime: '19:00',
          type: ['TECNICO', 'TATTICO', 'FISICO', 'PARTITA'][Math.floor(Math.random() * 4)],
          location: venues[Math.floor(Math.random() * 2)].name,
          notes: `Allenamento ${i + 1}`,
          organizationId: organization.id
        }
      });
      
      trainingSessions.push(session);
      
      // Registra presenze
      const teamAthletes = athletes.filter(a => a.teamId === team.id);
      for (const athlete of teamAthletes) {
        await prisma.trainingAttendance.create({
          data: {
            sessionId: session.id,
            athleteId: athlete.id,
            present: Math.random() > 0.15, // 85% presenza
            notes: Math.random() > 0.9 ? 'Ritardo' : null
          }
        });
      }
    }
  }

  console.log(`✅ ${trainingSessions.length} Sessioni allenamento create`);

  // 17. SPONSOR
  const sponsors = await Promise.all([
    prisma.sponsor.create({
      data: {
        name: 'SportStore Milano',
        type: 'MAIN',
        contactPerson: 'Giovanni Bianchi',
        email: 'info@sportstore.it',
        phone: '+39 02 12345678',
        website: 'www.sportstore.it',
        amount: 15000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: 'Sponsor principale - Fornitura materiale tecnico',
        logoUrl: '/sponsors/sportstore.png',
        isActive: true,
        organizationId: organization.id
      }
    }),
    prisma.sponsor.create({
      data: {
        name: 'Pizzeria Da Mario',
        type: 'SECONDARY',
        contactPerson: 'Mario Rossi',
        email: 'info@pizzeriamario.it',
        phone: '+39 02 87654321',
        amount: 5000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
        description: 'Sponsor cartellonistica campo',
        isActive: true,
        organizationId: organization.id
      }
    }),
    prisma.sponsor.create({
      data: {
        name: 'Banca Locale',
        type: 'SECONDARY',
        contactPerson: 'Lucia Verdi',
        email: 'sponsor@bancalocale.it',
        phone: '+39 02 11223344',
        amount: 8000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: 'Sponsor maglia gara',
        isActive: true,
        organizationId: organization.id
      }
    }),
    prisma.sponsor.create({
      data: {
        name: 'Autofficina Rapida',
        type: 'TECHNICAL',
        contactPerson: 'Franco Neri',
        email: 'info@autofficinarapida.it',
        phone: '+39 333 4455667',
        amount: 3000,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        description: 'Sponsor tecnico - Manutenzione pulmino',
        isActive: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Sponsor creati');

  // 18. STAFF
  const staff = await Promise.all([
    prisma.staff.create({
      data: {
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'ALLENATORE',
        email: 'mario.rossi@team.com',
        phone: '+39 333 1234567',
        qualification: 'UEFA A',
        teamId: 'team-u14',
        startDate: new Date('2023-09-01'),
        contractEnd: new Date('2025-06-30'),
        salary: 2000,
        organizationId: organization.id
      }
    }),
    prisma.staff.create({
      data: {
        firstName: 'Luigi',
        lastName: 'Verdi',
        role: 'ALLENATORE',
        email: 'luigi.verdi@team.com',
        phone: '+39 333 2345678',
        qualification: 'UEFA B',
        teamId: 'team-u12',
        startDate: new Date('2024-01-01'),
        contractEnd: new Date('2025-06-30'),
        salary: 1800,
        organizationId: organization.id
      }
    }),
    prisma.staff.create({
      data: {
        firstName: 'Giuseppe',
        lastName: 'Bianchi',
        role: 'PREPARATORE',
        email: 'giuseppe.bianchi@team.com',
        phone: '+39 333 3456789',
        qualification: 'Laurea Scienze Motorie',
        startDate: new Date('2023-09-01'),
        salary: 1500,
        organizationId: organization.id
      }
    }),
    prisma.staff.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Ferrari',
        role: 'MEDICO',
        email: 'dr.ferrari@team.com',
        phone: '+39 333 4567890',
        qualification: 'Medico Sportivo',
        startDate: new Date('2022-09-01'),
        salary: 500,
        organizationId: organization.id
      }
    }),
    prisma.staff.create({
      data: {
        firstName: 'Andrea',
        lastName: 'Romano',
        role: 'FISIOTERAPISTA',
        email: 'andrea.romano@team.com',
        phone: '+39 333 5678901',
        qualification: 'Fisioterapista Sportivo',
        startDate: new Date('2023-01-01'),
        salary: 1200,
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Staff creato');

  // 19. NOTIFICHE
  const notifications = [];
  
  // Notifiche documenti in scadenza
  const expiringDocs = documents.filter(d => d.status === 'EXPIRING');
  for (const doc of expiringDocs.slice(0, 5)) {
    notifications.push(
      await prisma.notification.create({
        data: {
          userId: 'user-admin',
          type: 'DOCUMENT_EXPIRING',
          title: 'Documento in scadenza',
          message: `Il documento sta per scadere`,
          priority: 'high',
          link: `/documents/${doc.id}`,
          organizationId: organization.id
        }
      })
    );
  }

  // Notifiche pagamenti scaduti
  const overduePayments = payments.filter(p => p.status === 'OVERDUE');
  for (const payment of overduePayments.slice(0, 5)) {
    notifications.push(
      await prisma.notification.create({
        data: {
          userId: 'user-admin',
          type: 'PAYMENT_OVERDUE',
          title: 'Pagamento scaduto',
          message: `Pagamento di €${payment.amount} scaduto`,
          priority: 'urgent',
          link: `/payments/${payment.id}`,
          organizationId: organization.id
        }
      })
    );
  }

  console.log(`✅ ${notifications.length} Notifiche create`);

  // 20. INFORTUNI (per alcuni atleti)
  const injuries = [];
  const injuredAthletes = athletes.filter(a => a.status === 'INJURED');
  
  for (const athlete of injuredAthletes) {
    injuries.push(
      await prisma.injury.create({
        data: {
          athleteId: athlete.id,
          injuryDate: subDays(new Date(), Math.floor(Math.random() * 30)),
          injuryType: ['MUSCOLARE', 'DISTORSIONE', 'CONTUSIONE', 'FRATTURA'][Math.floor(Math.random() * 4)],
          bodyPart: ['Caviglia', 'Ginocchio', 'Coscia', 'Polpaccio'][Math.floor(Math.random() * 4)],
          severity: ['LIEVE', 'MODERATA', 'GRAVE'][Math.floor(Math.random() * 3)],
          estimatedRecoveryDays: Math.floor(Math.random() * 30) + 7,
          notes: 'Infortunio durante allenamento',
          isRecovered: false,
          organizationId: organization.id
        }
      })
    );
  }

  console.log(`✅ ${injuries.length} Infortuni registrati`);

  console.log('\n🎉 SEED COMPLETATO CON SUCCESSO!');
  console.log('📊 Riepilogo dati inseriti:');
  console.log(`- ${athletes.length} Atleti`);
  console.log(`- ${documents.length} Documenti`);
  console.log(`- ${payments.length} Pagamenti`);
  console.log(`- ${matches.length} Partite`);
  console.log(`- ${trainingSessions.length} Allenamenti`);
  console.log(`- ${sponsors.length} Sponsor`);
  console.log(`- ${staff.length} Membri staff`);
  console.log(`- ${notifications.length} Notifiche`);
  console.log(`- ${injuries.length} Infortuni`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Errore durante il seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
