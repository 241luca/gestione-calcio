// Script per creare dati di esempio
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🎯 Creazione dati di esempio...');

    // Trova l'organizzazione demo
    const organization = await prisma.organization.findFirst({
      where: { name: 'Demo Soccer Club' }
    });

    if (!organization) {
      console.error('❌ Organizzazione Demo Soccer Club non trovata');
      return;
    }

    // Trova una squadra
    const team = await prisma.team.findFirst({
      where: { organizationId: organization.id }
    });

    if (!team) {
      console.error('❌ Nessuna squadra trovata');
      return;
    }

    // Crea alcuni atleti di esempio
    const athletes = [
      { firstName: 'Marco', lastName: 'Rossi', birthDate: new Date('2010-03-15'), fiscalCode: 'RSSMRC10C15H501X' },
      { firstName: 'Luca', lastName: 'Bianchi', birthDate: new Date('2011-07-22'), fiscalCode: 'BNCLCU11L22H501Y' },
      { firstName: 'Giovanni', lastName: 'Verdi', birthDate: new Date('2010-11-08'), fiscalCode: 'VRDGNN10S08H501Z' },
      { firstName: 'Alessandro', lastName: 'Romano', birthDate: new Date('2012-01-30'), fiscalCode: 'RMNLSS12A30H501W' },
      { firstName: 'Francesco', lastName: 'Esposito', birthDate: new Date('2011-05-12'), fiscalCode: 'SPSFNC11E12H501V' }
    ];

    const createdAthletes = [];

    for (const athleteData of athletes) {
      // Verifica se l'atleta esiste già
      const existing = await prisma.athlete.findFirst({
        where: { fiscalCode: athleteData.fiscalCode }
      });

      if (!existing) {
        const athlete = await prisma.athlete.create({
          data: {
            ...athleteData,
            organizationId: organization.id,
            teamId: team.id,
            status: 'ACTIVE',
            email: `${athleteData.firstName.toLowerCase()}.${athleteData.lastName.toLowerCase()}@example.com`,
            phone: '+39 333 ' + Math.floor(Math.random() * 9000000 + 1000000)
          }
        });
        createdAthletes.push(athlete);
        console.log(`✅ Atleta creato: ${athlete.firstName} ${athlete.lastName}`);
      } else {
        createdAthletes.push(existing);
        console.log(`⚠️  Atleta già esistente: ${existing.firstName} ${existing.lastName}`);
      }
    }

    // Trova i tipi di pagamento
    const paymentTypes = await prisma.paymentType.findMany();
    
    if (paymentTypes.length === 0) {
      console.error('❌ Nessun tipo di pagamento trovato');
      return;
    }

    // Trova l'utente demo
    const user = await prisma.user.findFirst({
      where: { email: 'demo@soccermanager.com' }
    });

    if (!user) {
      console.error('❌ Utente demo non trovato');
      return;
    }

    // Crea alcuni pagamenti di esempio per ogni atleta
    const today = new Date();
    for (const athlete of createdAthletes) {
      // Quota iscrizione (pagata)
      const existingRegistration = await prisma.payment.findFirst({
        where: {
          athleteId: athlete.id,
          typeId: paymentTypes.find(t => t.name === 'Quota Iscrizione')?.id
        }
      });

      if (!existingRegistration) {
        await prisma.payment.create({
          data: {
            organizationId: organization.id,
            athleteId: athlete.id,
            typeId: paymentTypes.find(t => t.name === 'Quota Iscrizione')?.id!,
            amount: 150,
            dueDate: new Date(today.getFullYear(), 8, 15), // 15 settembre
            status: 'PAID',
            paidAmount: 150,
            paidDate: new Date(today.getFullYear(), 8, 10),
            description: 'Quota iscrizione stagione 2024/2025',
            createdById: user.id
          }
        });
        console.log(`  💰 Pagamento iscrizione creato per ${athlete.firstName}`);
      }

      // Quota mensile ottobre (pagata)
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          athleteId: athlete.id,
          typeId: paymentTypes.find(t => t.name === 'Quota Mensile')?.id!,
          amount: 50,
          dueDate: new Date(today.getFullYear(), 9, 5), // 5 ottobre
          status: 'PAID',
          paidAmount: 50,
          paidDate: new Date(today.getFullYear(), 9, 3),
          description: 'Quota mensile Ottobre 2024',
          createdById: user.id
        }
      });

      // Quota mensile novembre (pagata)
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          athleteId: athlete.id,
          typeId: paymentTypes.find(t => t.name === 'Quota Mensile')?.id!,
          amount: 50,
          dueDate: new Date(today.getFullYear(), 10, 5), // 5 novembre
          status: 'PAID',
          paidAmount: 50,
          paidDate: new Date(today.getFullYear(), 10, 4),
          description: 'Quota mensile Novembre 2024',
          createdById: user.id
        }
      });

      // Quota mensile dicembre (in scadenza)
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          athleteId: athlete.id,
          typeId: paymentTypes.find(t => t.name === 'Quota Mensile')?.id!,
          amount: 50,
          dueDate: new Date(today.getFullYear(), 11, 5), // 5 dicembre
          status: 'PENDING',
          description: 'Quota mensile Dicembre 2024',
          createdById: user.id
        }
      });

      // Kit divisa (alcuni pagati, alcuni no)
      if (Math.random() > 0.5) {
        await prisma.payment.create({
          data: {
            organizationId: organization.id,
            athleteId: athlete.id,
            typeId: paymentTypes.find(t => t.name === 'Kit Divisa')?.id!,
            amount: 80,
            dueDate: new Date(today.getFullYear(), 9, 20),
            status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
            paidAmount: Math.random() > 0.3 ? 80 : null,
            paidDate: Math.random() > 0.3 ? new Date(today.getFullYear(), 9, 18) : null,
            description: 'Kit divisa completo stagione 2024/2025',
            createdById: user.id
          }
        });
      }

      console.log(`  ✅ Pagamenti creati per ${athlete.firstName}`);
    }

    console.log('\n🎉 Dati di esempio creati con successo!');
    console.log(`  - ${createdAthletes.length} atleti`);
    console.log(`  - ${createdAthletes.length * 4} pagamenti (circa)`);

  } catch (error) {
    console.error('❌ Errore durante la creazione dei dati di esempio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createSampleData();
