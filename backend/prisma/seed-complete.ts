import { PrismaClient, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays, addMonths, subMonths, addYears, subYears } from 'date-fns';

const prisma = new PrismaClient();

// Generatori di dati casuali
const nomi = ['Marco', 'Luca', 'Matteo', 'Andrea', 'Alessandro', 'Lorenzo', 'Francesco', 'Davide', 'Riccardo', 'Giuseppe', 'Antonio', 'Giovanni', 'Roberto', 'Paolo', 'Carlo', 'Franco', 'Luigi', 'Michele', 'Angelo', 'Vincenzo', 'Pietro', 'Mario', 'Sergio', 'Alberto', 'Giacomo', 'Stefano', 'Tommaso', 'Federico', 'Nicola', 'Simone'];
const cognomi = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone'];
const citta = ['Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia', 'Parma', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Ravenna', 'Livorno', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Monza'];
const vie = ['Via Roma', 'Via Milano', 'Via Garibaldi', 'Via Mazzini', 'Via Dante', 'Via Verdi', 'Via Marconi', 'Via Leonardo da Vinci', 'Via Galilei', 'Via Colombo', 'Via Kennedy', 'Via Venezia', 'Via Torino', 'Via Napoli', 'Via Bologna', 'Via Firenze', 'Via Genova', 'Via Padova', 'Via Trieste', 'Via Brescia'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFiscalCode(nome: string, cognome: string, birthDate: Date): string {
  const consonanti = (str: string) => str.toUpperCase().replace(/[AEIOU]/g, '');
  const vocali = (str: string) => str.toUpperCase().replace(/[^AEIOU]/g, '');
  
  let cf = consonanti(cognome).padEnd(3, vocali(cognome)).substring(0, 3);
  cf += consonanti(nome).padEnd(3, vocali(nome)).substring(0, 3);
  cf += birthDate.getFullYear().toString().substring(2);
  
  const mesi = 'ABCDEHLMPRST';
  cf += mesi[birthDate.getMonth()];
  cf += birthDate.getDate().toString().padStart(2, '0');
  cf += randomElement(['H501', 'F205', 'L219', 'A794', 'B157', 'C351', 'D612', 'E897', 'G273', 'I452']);
  cf += randomElement(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Z']);
  
  return cf;
}

async function main() {
  console.log('🌱 Inizio seed COMPLETO database con MOLTI dati...');
  console.log('⏳ Questo processo richiederà alcuni minuti...\n');

  try {
    // Pulizia database (opzionale - commenta se vuoi mantenere dati esistenti)
    console.log('🧹 Pulizia database esistente...');
    await prisma.transportBooking.deleteMany();
    await prisma.transportSchedule.deleteMany();
    await prisma.transportRoute.deleteMany();
    await prisma.trainingAttendance.deleteMany();
    await prisma.trainingSession.deleteMany();
    await prisma.matchStats.deleteMany();
    await prisma.matchRoster.deleteMany();
    await prisma.match.deleteMany();
    await prisma.injury.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.document.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.athlete.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.sponsor.deleteMany();
    await prisma.team.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.competition.deleteMany();
    await prisma.transportZone.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.role.deleteMany();
    await prisma.position.deleteMany();
    await prisma.documentType.deleteMany();
    await prisma.paymentType.deleteMany();
    console.log('✅ Database pulito\n');

    // ==========================================
    // 1. ORGANIZZAZIONE DEMO
    // ==========================================
    console.log('📋 Creazione organizzazione...');
    const org = await prisma.organization.create({
      data: {
        name: 'ASD Juventus Academy Milano',
        taxCode: 'IT12345678901',
        address: 'Via dello Sport, 100',
        city: 'Milano',
        province: 'MI',
        zipCode: '20142',
        email: 'info@juventusacademymilano.it',
        phone: '+39 02 8945 6789',
        website: 'www.juventusacademymilano.it',
        foundedYear: 2015,
        president: 'Giovanni Bianchi',
        colors: ['Bianco', 'Nero'],
        registrationNumber: 'REG2015MI001',
        bankAccount: 'IT60X0542811101000000123456'
      }
    });
    console.log('✅ Organizzazione creata\n');

    // ==========================================
    // 2. RUOLI
    // ==========================================
    console.log('📋 Creazione ruoli...');
    const adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Amministratore con accesso completo',
        permissions: ['*:*']
      }
    });

    const coachRole = await prisma.role.create({
      data: {
        name: 'coach',
        description: 'Allenatore',
        permissions: ['athletes:read', 'athletes:update', 'matches:*', 'trainings:*']
      }
    });

    const managerRole = await prisma.role.create({
      data: {
        name: 'manager',
        description: 'Dirigente',
        permissions: ['athletes:*', 'payments:*', 'documents:*', 'reports:read']
      }
    });

    const parentRole = await prisma.role.create({
      data: {
        name: 'parent',
        description: 'Genitore',
        permissions: ['athletes:read', 'payments:read', 'documents:read', 'matches:read']
      }
    });
    console.log('✅ Ruoli creati\n');

    // ==========================================
    // 3. UTENTI DEMO
    // ==========================================
    console.log('📋 Creazione utenti demo...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@juventusacademymilano.it',
        password: hashedPassword,
        firstName: 'Mario',
        lastName: 'Rossi',
        phone: '+39 338 1234567',
        roleId: adminRole.id,
        organizationId: org.id,
        isActive: true,
        emailVerified: true
      }
    });

    const coachUser = await prisma.user.create({
      data: {
        email: 'allenatore@juventusacademymilano.it',
        password: hashedPassword,
        firstName: 'Giuseppe',
        lastName: 'Verdi',
        phone: '+39 339 9876543',
        roleId: coachRole.id,
        organizationId: org.id,
        isActive: true,
        emailVerified: true
      }
    });

    const managerUser = await prisma.user.create({
      data: {
        email: 'dirigente@juventusacademymilano.it',
        password: hashedPassword,
        firstName: 'Franco',
        lastName: 'Bianchi',
        phone: '+39 335 5555555',
        roleId: managerRole.id,
        organizationId: org.id,
        isActive: true,
        emailVerified: true
      }
    });
    console.log('✅ Utenti creati\n');

    // ==========================================
    // 4. POSIZIONI DI GIOCO
    // ==========================================
    console.log('📋 Creazione posizioni...');
    const positions = await Promise.all([
      prisma.position.create({ data: { name: 'Portiere', abbreviation: 'POR' } }),
      prisma.position.create({ data: { name: 'Difensore Centrale', abbreviation: 'DC' } }),
      prisma.position.create({ data: { name: 'Terzino Destro', abbreviation: 'TD' } }),
      prisma.position.create({ data: { name: 'Terzino Sinistro', abbreviation: 'TS' } }),
      prisma.position.create({ data: { name: 'Centrocampista Centrale', abbreviation: 'CC' } }),
      prisma.position.create({ data: { name: 'Centrocampista Esterno', abbreviation: 'CE' } }),
      prisma.position.create({ data: { name: 'Trequartista', abbreviation: 'TRQ' } }),
      prisma.position.create({ data: { name: 'Attaccante', abbreviation: 'ATT' } }),
      prisma.position.create({ data: { name: 'Ala Destra', abbreviation: 'AD' } }),
      prisma.position.create({ data: { name: 'Ala Sinistra', abbreviation: 'AS' } })
    ]);
    console.log('✅ Posizioni create\n');

    // ==========================================
    // 5. TIPI DOCUMENTO
    // ==========================================
    console.log('📋 Creazione tipi documento...');
    const docTypes = await Promise.all([
      prisma.documentType.create({
        data: {
          name: 'Certificato Medico Sportivo',
          description: 'Certificato di idoneità sportiva agonistica',
          isRequired: true,
          hasExpiry: true,
          validityDays: 365
        }
      }),
      prisma.documentType.create({
        data: {
          name: 'Carta Identità',
          description: 'Documento di identità',
          isRequired: true,
          hasExpiry: true,
          validityDays: 3650
        }
      }),
      prisma.documentType.create({
        data: {
          name: 'Codice Fiscale',
          description: 'Tessera codice fiscale',
          isRequired: true,
          hasExpiry: false
        }
      }),
      prisma.documentType.create({
        data: {
          name: 'Foto Tessera',
          description: 'Fototessera per tesserino',
          isRequired: true,
          hasExpiry: false
        }
      }),
      prisma.documentType.create({
        data: {
          name: 'Consenso Privacy',
          description: 'Modulo privacy firmato',
          isRequired: true,
          hasExpiry: false
        }
      }),
      prisma.documentType.create({
        data: {
          name: 'Delega Ritiro',
          description: 'Delega per ritiro minore',
          isRequired: false,
          hasExpiry: true,
          validityDays: 365
        }
      })
    ]);
    console.log('✅ Tipi documento creati\n');

    // ==========================================
    // 6. TIPI PAGAMENTO
    // ==========================================
    console.log('📋 Creazione tipi pagamento...');
    const paymentTypes = await Promise.all([
      prisma.paymentType.create({
        data: {
          name: 'Iscrizione Annuale',
          description: 'Quota iscrizione stagione sportiva',
          amount: 150,
          isRecurring: false,
          frequency: 'ONE_TIME'
        }
      }),
      prisma.paymentType.create({
        data: {
          name: 'Quota Mensile',
          description: 'Retta mensile',
          amount: 80,
          isRecurring: true,
          frequency: 'MONTHLY'
        }
      }),
      prisma.paymentType.create({
        data: {
          name: 'Kit Divisa',
          description: 'Kit completo divisa gara e allenamento',
          amount: 120,
          isRecurring: false,
          frequency: 'ONE_TIME'
        }
      }),
      prisma.paymentType.create({
        data: {
          name: 'Assicurazione',
          description: 'Quota assicurativa annuale',
          amount: 50,
          isRecurring: false,
          frequency: 'YEARLY'
        }
      }),
      prisma.paymentType.create({
        data: {
          name: 'Camp Estivo',
          description: 'Partecipazione camp estivo',
          amount: 250,
          isRecurring: false,
          frequency: 'ONE_TIME'
        }
      }),
      prisma.paymentType.create({
        data: {
          name: 'Torneo',
          description: 'Quota partecipazione torneo',
          amount: 30,
          isRecurring: false,
          frequency: 'ONE_TIME'
        }
      })
    ]);
    console.log('✅ Tipi pagamento creati\n');

    // ==========================================
    // 7. ZONE TRASPORTO
    // ==========================================
    console.log('📋 Creazione zone trasporto...');
    const zones = await Promise.all([
      prisma.transportZone.create({
        data: {
          name: 'Zona Centro',
          description: 'Milano centro - Duomo, Brera, Porta Venezia',
          organizationId: org.id
        }
      }),
      prisma.transportZone.create({
        data: {
          name: 'Zona Nord',
          description: 'Milano nord - Niguarda, Bicocca, Sesto',
          organizationId: org.id
        }
      }),
      prisma.transportZone.create({
        data: {
          name: 'Zona Sud',
          description: 'Milano sud - Navigli, Bocconi, Corvetto',
          organizationId: org.id
        }
      }),
      prisma.transportZone.create({
        data: {
          name: 'Zona Est',
          description: 'Milano est - Lambrate, Città Studi, Loreto',
          organizationId: org.id
        }
      }),
      prisma.transportZone.create({
        data: {
          name: 'Zona Ovest',
          description: 'Milano ovest - San Siro, Sempione, Lorenteggio',
          organizationId: org.id
        }
      })
    ]);
    console.log('✅ Zone trasporto create\n');

    // ==========================================
    // 8. SQUADRE (CATEGORIE)
    // ==========================================
    console.log('📋 Creazione squadre per categorie...');
    const teams = [];
    const categories = [
      { name: 'Primi Calci 2018', category: 'U7', yearStart: 2018, yearEnd: 2018 },
      { name: 'Primi Calci 2017', category: 'U8', yearStart: 2017, yearEnd: 2017 },
      { name: 'Pulcini 2016', category: 'U9', yearStart: 2016, yearEnd: 2016 },
      { name: 'Pulcini 2015', category: 'U10', yearStart: 2015, yearEnd: 2015 },
      { name: 'Pulcini 2014', category: 'U11', yearStart: 2014, yearEnd: 2014 },
      { name: 'Esordienti 2013', category: 'U12', yearStart: 2013, yearEnd: 2013 },
      { name: 'Esordienti 2012', category: 'U13', yearStart: 2012, yearEnd: 2012 },
      { name: 'Giovanissimi 2011', category: 'U14', yearStart: 2011, yearEnd: 2011 },
      { name: 'Giovanissimi 2010', category: 'U15', yearStart: 2010, yearEnd: 2010 },
      { name: 'Allievi 2009', category: 'U16', yearStart: 2009, yearEnd: 2009 },
      { name: 'Allievi 2008', category: 'U17', yearStart: 2008, yearEnd: 2008 },
      { name: 'Juniores', category: 'U19', yearStart: 2006, yearEnd: 2007 }
    ];

    for (const cat of categories) {
      const team = await prisma.team.create({
        data: {
          name: cat.name,
          category: cat.category,
          season: '2024/2025',
          organizationId: org.id
        }
      });
      teams.push({ ...team, ...cat });
    }
    console.log(`✅ ${teams.length} squadre create\n`);

    // ==========================================
    // 9. STAFF TECNICO
    // ==========================================
    console.log('📋 Creazione staff tecnico...');
    const staffMembers = [];
    
    for (const team of teams) {
      // Allenatore principale
      const headCoach = await prisma.staff.create({
        data: {
          organizationId: org.id,
          firstName: randomElement(nomi),
          lastName: randomElement(cognomi),
          role: 'ALLENATORE',
          teamId: team.id,
          email: `coach.${team.category.toLowerCase()}@juventusacademymilano.it`,
          phone: `+39 33${randomNumber(3, 9)} ${randomNumber(1000000, 9999999)}`,
          licenseNumber: `UEFA-B-${randomNumber(10000, 99999)}`,
          licenseExpiry: addYears(new Date(), 2),
          qualification: 'UEFA B',
          startDate: subYears(new Date(), randomNumber(1, 5)),
          isActive: true
        }
      });
      
      // Assistente allenatore (per squadre più grandi)
      if (['U14', 'U15', 'U16', 'U17', 'U19'].includes(team.category)) {
        await prisma.staff.create({
          data: {
            organizationId: org.id,
            firstName: randomElement(nomi),
            lastName: randomElement(cognomi),
            role: 'ASSISTENTE',
            teamId: team.id,
            email: `assistant.${team.category.toLowerCase()}@juventusacademymilano.it`,
            phone: `+39 33${randomNumber(3, 9)} ${randomNumber(1000000, 9999999)}`,
            qualification: 'Istruttore FIGC',
            startDate: subYears(new Date(), randomNumber(1, 3)),
            isActive: true
          }
        });
      }
      
      staffMembers.push(headCoach);
    }
    
    // Staff generale società
    await prisma.staff.create({
      data: {
        organizationId: org.id,
        firstName: 'Roberto',
        lastName: 'Mancini',
        role: 'PREPARATORE',
        email: 'preparatore.atletico@juventusacademymilano.it',
        phone: '+39 335 1234567',
        qualification: 'Laurea Scienze Motorie',
        startDate: subYears(new Date(), 3),
        isActive: true
      }
    });

    await prisma.staff.create({
      data: {
        organizationId: org.id,
        firstName: 'Dott. Luigi',
        lastName: 'Verdi',
        role: 'MEDICO',
        email: 'medico@juventusacademymilano.it',
        phone: '+39 335 9876543',
        qualification: 'Medico Sportivo',
        licenseNumber: 'MED-MI-12345',
        startDate: subYears(new Date(), 5),
        isActive: true
      }
    });
    
    console.log(`✅ ${staffMembers.length + 2} membri staff creati\n`);

    // ==========================================
    // 10. ATLETI (25-30 per squadra)
    // ==========================================
    console.log('📋 Creazione atleti (questo richiederà qualche minuto)...');
    const athletes = [];
    let athleteCount = 0;

    for (const team of teams) {
      const athletesPerTeam = randomNumber(25, 30);
      
      for (let i = 0; i < athletesPerTeam; i++) {
        const firstName = randomElement(nomi);
        const lastName = randomElement(cognomi);
        const birthYear = randomNumber(team.yearStart, team.yearEnd);
        const birthDate = new Date(birthYear, randomNumber(0, 11), randomNumber(1, 28));
        const fiscalCode = generateFiscalCode(firstName, lastName, birthDate);
        
        const athlete = await prisma.athlete.create({
          data: {
            firstName,
            lastName,
            birthDate,
            birthPlace: randomElement(citta),
            nationality: Math.random() > 0.9 ? randomElement(['Albanese', 'Rumena', 'Marocchina', 'Egiziana', 'Cinese']) : 'Italiana',
            fiscalCode,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${birthYear}@gmail.com`,
            phone: `+39 3${randomNumber(20, 99)} ${randomNumber(1000000, 9999999)}`,
            address: `${randomElement(vie)}, ${randomNumber(1, 150)}`,
            city: 'Milano',
            province: 'MI',
            zipCode: `201${randomNumber(10, 99)}`,
            teamId: team.id,
            positionId: randomElement(positions).id,
            jerseyNumber: i + 1,
            status: Math.random() > 0.95 ? randomElement(['INJURED', 'SUSPENDED']) : 'ACTIVE',
            height: randomNumber(140 + (birthYear <= 2010 ? 20 : 0), 180 + (birthYear <= 2010 ? 10 : 0)),
            weight: randomNumber(35 + (birthYear <= 2010 ? 10 : 0), 70 + (birthYear <= 2010 ? 15 : 0)),
            footPreference: randomElement(['RIGHT', 'LEFT', 'BOTH']),
            transportZoneId: Math.random() > 0.3 ? randomElement(zones).id : null,
            hasTransportService: Math.random() > 0.7,
            parentName: `${randomElement(['Sig.', 'Sig.ra'])} ${randomElement(cognomi)}`,
            parentPhone: `+39 3${randomNumber(20, 99)} ${randomNumber(1000000, 9999999)}`,
            parentEmail: `${lastName.toLowerCase()}.famiglia@gmail.com`,
            medicalNotes: Math.random() > 0.9 ? randomElement(['Asma lieve', 'Allergia graminacee', 'Intolleranza lattosio']) : null,
            organizationId: org.id
          }
        });
        
        athletes.push(athlete);
        athleteCount++;
        
        if (athleteCount % 50 === 0) {
          console.log(`  ... ${athleteCount} atleti creati`);
        }
      }
    }
    console.log(`✅ ${athletes.length} atleti totali creati\n`);

    // ==========================================
    // 11. DOCUMENTI PER ATLETI
    // ==========================================
    console.log('📋 Creazione documenti atleti...');
    let docCount = 0;
    
    for (const athlete of athletes) {
      // Certificato medico (90% ce l'hanno, alcuni scaduti)
      if (Math.random() > 0.1) {
        const expiryDate = addDays(new Date(), randomNumber(-30, 330));
        await prisma.document.create({
          data: {
            athleteId: athlete.id,
            typeId: docTypes[0].id, // Certificato Medico
            fileName: `certificato_medico_${athlete.lastName.toLowerCase()}.pdf`,
            fileUrl: `/uploads/documents/certificato_${athlete.id}.pdf`,
            fileSize: randomNumber(100000, 500000),
            mimeType: 'application/pdf',
            issueDate: subDays(expiryDate, 365),
            expiryDate,
            status: expiryDate < new Date() ? 'EXPIRED' : 
                   expiryDate < addDays(new Date(), 30) ? 'EXPIRING' : 'VALID',
            isVerified: Math.random() > 0.2,
            verifiedBy: adminUser.id,
            verifiedAt: Math.random() > 0.2 ? subDays(new Date(), randomNumber(1, 30)) : null,
            organizationId: org.id
          }
        });
        docCount++;
      }
      
      // Carta identità (95% ce l'hanno)
      if (Math.random() > 0.05) {
        const expiryDate = addYears(new Date(), randomNumber(1, 9));
        await prisma.document.create({
          data: {
            athleteId: athlete.id,
            typeId: docTypes[1].id, // Carta Identità
            fileName: `carta_identita_${athlete.lastName.toLowerCase()}.pdf`,
            fileUrl: `/uploads/documents/ci_${athlete.id}.pdf`,
            fileSize: randomNumber(200000, 800000),
            mimeType: 'application/pdf',
            issueDate: subYears(expiryDate, 10),
            expiryDate,
            status: 'VALID',
            isVerified: true,
            verifiedBy: adminUser.id,
            verifiedAt: subDays(new Date(), randomNumber(30, 180)),
            organizationId: org.id
          }
        });
        docCount++;
      }
      
      // Altri documenti random
      if (Math.random() > 0.3) {
        await prisma.document.create({
          data: {
            athleteId: athlete.id,
            typeId: docTypes[2].id, // Codice Fiscale
            fileName: `codice_fiscale_${athlete.lastName.toLowerCase()}.jpg`,
            fileUrl: `/uploads/documents/cf_${athlete.id}.jpg`,
            fileSize: randomNumber(50000, 200000),
            mimeType: 'image/jpeg',
            status: 'VALID',
            isVerified: true,
            organizationId: org.id
          }
        });
        docCount++;
      }
    }
    console.log(`✅ ${docCount} documenti creati\n`);

    // ==========================================
    // 12. PAGAMENTI
    // ==========================================
    console.log('📋 Creazione storico pagamenti...');
    let paymentCount = 0;
    
    for (const athlete of athletes) {
      // Iscrizione annuale
      const iscrizioneStatus = randomElement(['PAID', 'PAID', 'PAID', 'PENDING', 'OVERDUE']) as PaymentStatus;
      await prisma.payment.create({
        data: {
          organizationId: org.id,
          athleteId: athlete.id,
          typeId: paymentTypes[0].id, // Iscrizione
          amount: 150,
          paidAmount: iscrizioneStatus === 'PAID' ? 150 : 0,
          dueDate: subMonths(new Date(), 3),
          paidDate: iscrizioneStatus === 'PAID' ? subMonths(new Date(), 2) : null,
          status: iscrizioneStatus,
          paymentMethod: iscrizioneStatus === 'PAID' ? randomElement(['BONIFICO', 'CONTANTI', 'CARTA']) : null,
          description: 'Iscrizione stagione 2024/2025',
          createdById: managerUser.id
        }
      });
      paymentCount++;
      
      // Quote mensili (ultimi 6 mesi)
      for (let month = 5; month >= 0; month--) {
        const dueDate = subMonths(new Date(), month);
        const isPaid = Math.random() > 0.15; // 85% pagati
        const isPartial = !isPaid && Math.random() > 0.7; // 30% dei non pagati sono parziali
        
        await prisma.payment.create({
          data: {
            organizationId: org.id,
            athleteId: athlete.id,
            typeId: paymentTypes[1].id, // Quota Mensile
            amount: 80,
            paidAmount: isPaid ? 80 : isPartial ? randomNumber(20, 60) : 0,
            dueDate,
            paidDate: isPaid ? addDays(dueDate, randomNumber(0, 15)) : null,
            status: (isPaid ? 'PAID' : 
                   isPartial ? 'PARTIAL' :
                   dueDate < subDays(new Date(), 30) ? 'OVERDUE' : 'PENDING') as PaymentStatus,
            paymentMethod: isPaid ? randomElement(['BONIFICO', 'CONTANTI', 'CARTA', 'SATISPAY']) : null,
            description: `Quota mensile ${dueDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`,
            createdById: managerUser.id
          }
        });
        paymentCount++;
      }
      
      // Kit divisa (70% l'hanno comprato)
      if (Math.random() > 0.3) {
        await prisma.payment.create({
          data: {
            organizationId: org.id,
            athleteId: athlete.id,
            typeId: paymentTypes[2].id, // Kit Divisa
            amount: 120,
            paidAmount: 120,
            dueDate: subMonths(new Date(), 4),
            paidDate: subMonths(new Date(), 4),
            status: 'PAID' as PaymentStatus,
            paymentMethod: randomElement(['BONIFICO', 'CARTA']),
            description: 'Kit divisa completo taglia ' + randomElement(['S', 'M', 'L', 'XL']),
            createdById: managerUser.id
          }
        });
        paymentCount++;
      }
    }
    console.log(`✅ ${paymentCount} pagamenti creati\n`);

    // ==========================================
    // 13. COMPETIZIONI
    // ==========================================
    console.log('📋 Creazione competizioni...');
    const competitions = [];
    
    for (const team of teams) {
      // Campionato provinciale
      const campionato = await prisma.competition.create({
        data: {
          name: `Campionato Provinciale ${team.category}`,
          type: 'CAMPIONATO',
          category: team.category,
          season: '2024/2025',
          startDate: new Date(2024, 8, 15), // 15 settembre
          endDate: new Date(2025, 4, 30), // 30 maggio
          organizationId: org.id
        }
      });
      competitions.push(campionato);
      
      // Coppa
      if (['U14', 'U15', 'U16', 'U17', 'U19'].includes(team.category)) {
        const coppa = await prisma.competition.create({
          data: {
            name: `Coppa Lombardia ${team.category}`,
            type: 'COPPA',
            category: team.category,
            season: '2024/2025',
            startDate: new Date(2024, 9, 1),
            endDate: new Date(2025, 3, 30),
            organizationId: org.id
          }
        });
        competitions.push(coppa);
      }
      
      // Torneo
      const torneo = await prisma.competition.create({
        data: {
          name: `Torneo di Natale ${team.category}`,
          type: 'TORNEO',
          category: team.category,
          season: '2024/2025',
          startDate: new Date(2024, 11, 20),
          endDate: new Date(2024, 11, 23),
          organizationId: org.id
        }
      });
      competitions.push(torneo);
    }
    console.log(`✅ ${competitions.length} competizioni create\n`);

    // ==========================================
    // 14. CAMPI DA GIOCO
    // ==========================================
    console.log('📋 Creazione campi da gioco...');
    const venues = await Promise.all([
      prisma.venue.create({
        data: {
          name: 'Centro Sportivo Juventus Academy',
          address: 'Via dello Sport, 100',
          city: 'Milano',
          province: 'MI',
          capacity: 500,
          type: 'HOME',
          isHome: true,
          surface: 'ERBA_SINTETICA',
          hasLighting: true,
          organizationId: org.id
        }
      }),
      prisma.venue.create({
        data: {
          name: 'Campo Comunale Lambrate',
          address: 'Via Lambrate, 50',
          city: 'Milano',
          province: 'MI',
          capacity: 300,
          type: 'AWAY',
          isHome: false,
          surface: 'ERBA_NATURALE',
          hasLighting: true,
          organizationId: org.id
        }
      }),
      prisma.venue.create({
        data: {
          name: 'Centro Sportivo Milanello Junior',
          address: 'Via Milanello, 1',
          city: 'Carnago',
          province: 'VA',
          capacity: 1000,
          type: 'NEUTRAL',
          isHome: false,
          surface: 'ERBA_NATURALE',
          hasLighting: true,
          organizationId: org.id
        }
      })
    ]);
    console.log('✅ Campi da gioco creati\n');

    // ==========================================
    // 15. PARTITE
    // ==========================================
    console.log('📋 Creazione calendario partite...');
    let matchCount = 0;
    
    for (const team of teams) {
      const competition = competitions.find(c => c.category === team.category && c.type === 'CAMPIONATO');
      
      // Creiamo 10-15 partite per squadra (passate e future)
      for (let i = 0; i < randomNumber(10, 15); i++) {
        const isHome = Math.random() > 0.5;
        const matchDate = addDays(new Date(), randomNumber(-60, 60));
        const isPlayed = matchDate < new Date();
        
        const match = await prisma.match.create({
          data: {
            homeTeamId: isHome ? team.id : team.id,
            awayTeamId: team.id,
            date: matchDate,
            time: randomElement(['09:00', '10:30', '14:30', '15:00', '16:30', '18:00']),
            venueId: isHome ? venues[0].id : randomElement(venues.slice(1)).id,
            competitionId: competition?.id,
            matchType: 'CAMPIONATO',
            homeScore: isPlayed ? randomNumber(0, 5) : null,
            awayScore: isPlayed ? randomNumber(0, 5) : null,
            status: isPlayed ? 'COMPLETED' : 
                   matchDate < addDays(new Date(), 1) ? 'SCHEDULED' : 'SCHEDULED',
            isHome,
            opponentName: `${randomElement(['AC', 'FC', 'US', 'ASD'])} ${randomElement(citta)}`,
            organizationId: org.id
          }
        });
        matchCount++;
        
        // Convocazioni per partite future
        if (!isPlayed) {
          const teamAthletes = athletes.filter(a => a.teamId === team.id && a.status === 'ACTIVE');
          const convocati = teamAthletes.slice(0, randomNumber(14, 18));
          
          for (let j = 0; j < convocati.length; j++) {
            await prisma.matchRoster.create({
              data: {
                matchId: match.id,
                athleteId: convocati[j].id,
                isStarter: j < 11,
                position: positions.find(p => p.id === convocati[j].positionId)?.abbreviation
              }
            });
          }
        }
        
        // Statistiche per partite giocate
        if (isPlayed) {
          const teamAthletes = athletes.filter(a => a.teamId === team.id);
          const played = teamAthletes.slice(0, randomNumber(11, 16));
          
          for (const player of played) {
            await prisma.matchStats.create({
              data: {
                matchId: match.id,
                athleteId: player.id,
                minutesPlayed: randomNumber(45, 90),
                goals: Math.random() > 0.8 ? randomNumber(0, 2) : 0,
                assists: Math.random() > 0.85 ? randomNumber(0, 2) : 0,
                yellowCards: Math.random() > 0.9 ? 1 : 0,
                redCards: Math.random() > 0.98 ? 1 : 0
              }
            });
          }
        }
      }
    }
    console.log(`✅ ${matchCount} partite create\n`);

    // ==========================================
    // 16. ALLENAMENTI
    // ==========================================
    console.log('📋 Creazione allenamenti...');
    let trainingCount = 0;
    
    for (const team of teams) {
      // Allenamenti settimanali (martedì e giovedì)
      for (let week = -4; week <= 4; week++) {
        for (const dayOffset of [2, 4]) { // Martedì e Giovedì
          const trainingDate = addDays(new Date(), week * 7 + dayOffset);
          
          const training = await prisma.trainingSession.create({
            data: {
              teamId: team.id,
              date: trainingDate,
              startTime: team.category.startsWith('U1') ? '17:00' : '15:30',
              endTime: team.category.startsWith('U1') ? '19:00' : '17:00',
              location: venues[0].name,
              type: randomElement(['TECNICO', 'TATTICO', 'FISICO', 'MISTO']),
              description: randomElement(['Esercitazioni tecniche', 'Schemi di gioco', 'Preparazione atletica', 'Partitella']),
              organizationId: org.id
            }
          });
          trainingCount++;
          
          // Presenze per allenamenti passati
          if (trainingDate < new Date()) {
            const teamAthletes = athletes.filter(a => a.teamId === team.id);
            
            for (const athlete of teamAthletes) {
              const isPresent = Math.random() > 0.15; // 85% presenza
              
              await prisma.trainingAttendance.create({
                data: {
                  sessionId: training.id,
                  athleteId: athlete.id,
                  present: isPresent,
                  reason: !isPresent ? randomElement(['Malattia', 'Impegni familiari', 'Scuola', 'Infortunio']) : null
                }
              });
            }
          }
        }
      }
    }
    console.log(`✅ ${trainingCount} allenamenti creati\n`);

    // ==========================================
    // 17. INFORTUNI
    // ==========================================
    console.log('📋 Creazione storico infortuni...');
    let injuryCount = 0;
    
    // 5% degli atleti ha avuto un infortunio
    const injuredAthletes = athletes.filter(() => Math.random() < 0.05);
    
    for (const athlete of injuredAthletes) {
      const injuryDate = subDays(new Date(), randomNumber(1, 90));
      const recoveryDays = randomNumber(7, 45);
      const isRecovered = addDays(injuryDate, recoveryDays) < new Date();
      
      await prisma.injury.create({
        data: {
          athleteId: athlete.id,
          injuryDate,
          injuryType: randomElement(['MUSCOLARE', 'DISTORSIONE', 'CONTUSIONE', 'STIRAMENTO']),
          bodyPart: randomElement(['Caviglia', 'Ginocchio', 'Coscia', 'Polpaccio', 'Schiena']),
          description: 'Infortunio durante ' + randomElement(['allenamento', 'partita', 'riscaldamento']),
          severity: randomElement(['LIEVE', 'MODERATA', 'GRAVE']),
          estimatedRecoveryDays: recoveryDays,
          isRecovered,
          recoveryDate: isRecovered ? addDays(injuryDate, recoveryDays) : null,
          organizationId: org.id
        }
      });
      injuryCount++;
      
      // Aggiorna stato atleta se ancora infortunato
      if (!isRecovered) {
        await prisma.athlete.update({
          where: { id: athlete.id },
          data: { status: 'INJURED' }
        });
      }
    }
    console.log(`✅ ${injuryCount} infortuni registrati\n`);

    // ==========================================
    // 18. SPONSOR
    // ==========================================
    console.log('📋 Creazione sponsor...');
    const sponsors = await Promise.all([
      prisma.sponsor.create({
        data: {
          organizationId: org.id,
          name: 'Banca Popolare di Milano',
          type: 'MAIN',
          contactPerson: 'Dott. Mario Bianchi',
          contactEmail: 'sponsorship@bpm.it',
          contactPhone: '+39 02 7700 1234',
          website: 'www.bpm.it',
          amount: 50000,
          status: 'ACTIVE',
          startDate: subYears(new Date(), 2),
          endDate: addYears(new Date(), 1),
          description: 'Sponsor principale maglia gara'
        }
      }),
      prisma.sponsor.create({
        data: {
          organizationId: org.id,
          name: 'Decathlon Milano',
          type: 'TECHNICAL',
          contactPerson: 'Sig. Giuseppe Verdi',
          contactEmail: 'partnership@decathlon.it',
          contactPhone: '+39 02 8844 5566',
          website: 'www.decathlon.it',
          amount: 15000,
          status: 'ACTIVE',
          startDate: subYears(new Date(), 1),
          endDate: addMonths(new Date(), 6),
          description: 'Fornitore materiale tecnico'
        }
      }),
      prisma.sponsor.create({
        data: {
          organizationId: org.id,
          name: 'Ristorante Da Luigi',
          type: 'SECONDARY',
          contactPerson: 'Luigi Rossi',
          contactEmail: 'info@daluigi.it',
          contactPhone: '+39 02 3355 7799',
          amount: 5000,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: addYears(new Date(), 1),
          description: 'Sponsor locale - pranzi squadra'
        }
      })
    ]);
    console.log('✅ Sponsor creati\n');

    // ==========================================
    // 19. NOTIFICHE
    // ==========================================
    console.log('📋 Creazione notifiche di esempio...');
    
    // Notifiche documenti in scadenza
    const expiringDocs = await prisma.document.findMany({
      where: {
        status: 'EXPIRING',
        organizationId: org.id
      },
      include: {
        athlete: true,
        type: true
      },
      take: 10
    });
    
    for (const doc of expiringDocs) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          organizationId: org.id,
          type: 'DOCUMENT_EXPIRING',
          title: 'Documento in scadenza',
          message: `Il ${doc.type.name} di ${doc.athlete.firstName} ${doc.athlete.lastName} scadrà tra pochi giorni`,
          link: `/athletes/${doc.athleteId}/documents`,
          priority: 'high'
        }
      });
    }
    
    // Notifiche pagamenti scaduti
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'OVERDUE',
        organizationId: org.id
      },
      include: {
        athlete: true,
        type: true
      },
      take: 10
    });
    
    for (const payment of overduePayments) {
      await prisma.notification.create({
        data: {
          userId: managerUser.id,
          organizationId: org.id,
          type: 'PAYMENT_OVERDUE',
          title: 'Pagamento scaduto',
          message: `${payment.athlete.firstName} ${payment.athlete.lastName} - ${payment.type.name} scaduto da ${Math.floor((new Date().getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24))} giorni`,
          link: `/payments?athleteId=${payment.athleteId}`,
          priority: 'urgent'
        }
      });
    }
    
    // Notifiche prossime partite
    const upcomingMatches = await prisma.match.findMany({
      where: {
        organizationId: org.id,
        date: {
          gte: new Date(),
          lte: addDays(new Date(), 7)
        }
      },
      include: {
        homeTeam: true
      },
      take: 5
    });
    
    for (const match of upcomingMatches) {
      await prisma.notification.create({
        data: {
          userId: coachUser.id,
          organizationId: org.id,
          type: 'MATCH_REMINDER',
          title: 'Prossima partita',
          message: `${match.homeTeam?.name} - ${match.opponentName} il ${match.date.toLocaleDateString('it-IT')}`,
          link: `/matches/${match.id}`,
          priority: 'normal'
        }
      });
    }
    
    console.log('✅ Notifiche create\n');

    // ==========================================
    // 20. ROUTE E SCHEDULE TRASPORTI
    // ==========================================
    console.log('📋 Creazione route trasporti...');
    
    const routes = await Promise.all([
      prisma.transportRoute.create({
        data: {
          organizationId: org.id,
          name: 'Linea Centro-Campo',
          description: 'Percorso dal centro città al campo sportivo',
          driver: 'Giovanni Bianchi',
          vehiclePlate: 'FG 123 AB',
          capacity: 8,
          startPoint: 'Piazza Duomo',
          endPoint: 'Centro Sportivo',
          stops: ['Porta Venezia', 'Corso Buenos Aires', 'Loreto', 'Lambrate'],
          distance: 12.5,
          estimatedTime: 35,
          isActive: true
        }
      }),
      prisma.transportRoute.create({
        data: {
          organizationId: org.id,
          name: 'Linea Nord-Campo',
          description: 'Percorso da Milano Nord al campo',
          driver: 'Marco Verdi',
          vehiclePlate: 'FH 456 CD',
          capacity: 8,
          startPoint: 'Niguarda',
          endPoint: 'Centro Sportivo',
          stops: ['Bicocca', 'Sesto San Giovanni', 'Cologno'],
          distance: 15.0,
          estimatedTime: 40,
          isActive: true
        }
      })
    ]);
    
    // Schedule per prossime partite
    const futureMatches = await prisma.match.findMany({
      where: {
        organizationId: org.id,
        date: {
          gte: new Date(),
          lte: addDays(new Date(), 30)
        }
      },
      take: 10
    });
    
    for (const match of futureMatches) {
      for (const route of routes) {
        const schedule = await prisma.transportSchedule.create({
          data: {
            routeId: route.id,
            matchId: match.id,
            pickupTime: subHours(match.date, 2),
            returnTime: addHours(match.date, 3),
            status: 'SCHEDULED'
          }
        });
        
        // Alcune prenotazioni
        const transportAthletes = athletes
          .filter(a => a.hasTransportService && a.transportZoneId)
          .slice(0, randomNumber(3, 6));
        
        for (const athlete of transportAthletes) {
          await prisma.transportBooking.create({
            data: {
              scheduleId: schedule.id,
              athleteId: athlete.id,
              pickupPoint: randomElement(['Fermata 1', 'Fermata 2', 'Fermata 3']),
              status: 'CONFIRMED'
            }
          });
        }
      }
    }
    
    console.log('✅ Route e schedule trasporti creati\n');

    // ==========================================
    // RIEPILOGO FINALE
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETATO CON SUCCESSO!');
    console.log('='.repeat(60));
    
    const summary = await prisma.$transaction([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.team.count(),
      prisma.athlete.count(),
      prisma.document.count(),
      prisma.payment.count(),
      prisma.match.count(),
      prisma.trainingSession.count(),
      prisma.staff.count(),
      prisma.sponsor.count(),
      prisma.notification.count()
    ]);
    
    console.log('\n📊 DATI CREATI:');
    console.log(`  • Organizzazioni: ${summary[0]}`);
    console.log(`  • Utenti: ${summary[1]}`);
    console.log(`  • Squadre: ${summary[2]}`);
    console.log(`  • Atleti: ${summary[3]}`);
    console.log(`  • Documenti: ${summary[4]}`);
    console.log(`  • Pagamenti: ${summary[5]}`);
    console.log(`  • Partite: ${summary[6]}`);
    console.log(`  • Allenamenti: ${summary[7]}`);
    console.log(`  • Staff: ${summary[8]}`);
    console.log(`  • Sponsor: ${summary[9]}`);
    console.log(`  • Notifiche: ${summary[10]}`);
    
    console.log('\n🔑 CREDENZIALI DI ACCESSO:');
    console.log('  Admin:');
    console.log('    Email: admin@juventusacademymilano.it');
    console.log('    Password: password123');
    console.log('  Allenatore:');
    console.log('    Email: allenatore@juventusacademymilano.it');
    console.log('    Password: password123');
    console.log('  Dirigente:');
    console.log('    Email: dirigente@juventusacademymilano.it');
    console.log('    Password: password123');
    
    console.log('\n✅ Il database è ora popolato con dati realistici!');
    console.log('   Puoi iniziare a utilizzare il sistema.\n');
    
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Funzione helper per aggiungere ore
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

// Esegui seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
