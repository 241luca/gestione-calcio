// backend/src/scripts/create-test-data.ts
import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🔧 Creazione dati di test per notifiche...');

  try {
    // Trova un'organizzazione e un atleta
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata');
      return;
    }

    const athlete = await prisma.athlete.findFirst({
      where: { organizationId: organization.id }
    });
    if (!athlete) {
      console.error('❌ Nessun atleta trovato');
      return;
    }

    // Trova o crea tipi di documenti
    let docType = await prisma.documentType.findFirst({
      where: { name: 'Certificato Medico' }
    });
    
    if (!docType) {
      docType = await prisma.documentType.create({
        data: {
          name: 'Certificato Medico',
          description: 'Certificato medico sportivo',
          isRequired: true,
          hasExpiry: true,
          validityDays: 365
        }
      });
    }

    // Crea documenti con diverse scadenze per test
    const documents = [
      {
        // Documento che scade tra 3 giorni (URGENTE)
        organizationId: organization.id,
        athleteId: athlete.id,
        typeId: docType.id,
        fileName: 'certificato_medico_urgent.pdf',
        fileUrl: '/test/certificato_urgent.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        expiryDate: addDays(new Date(), 3),
        status: 'EXPIRING' as const,
        notes: 'Test documento urgente'
      },
      {
        // Documento che scade tra 14 giorni
        organizationId: organization.id,
        athleteId: athlete.id,
        typeId: docType.id,
        fileName: 'certificato_medico_warning.pdf',
        fileUrl: '/test/certificato_warning.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        expiryDate: addDays(new Date(), 14),
        status: 'EXPIRING' as const,
        notes: 'Test documento in scadenza'
      },
      {
        // Documento che scade tra 30 giorni
        organizationId: organization.id,
        athleteId: athlete.id,
        typeId: docType.id,
        fileName: 'certificato_medico_info.pdf',
        fileUrl: '/test/certificato_info.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        expiryDate: addDays(new Date(), 30),
        status: 'VALID' as const,
        notes: 'Test documento normale'
      }
    ];

    // Crea i documenti
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
      console.log(`✅ Creato documento che scade il ${doc.expiryDate.toLocaleDateString('it-IT')}`);
    }

    // Trova o crea tipo pagamento
    let paymentType = await prisma.paymentType.findFirst({
      where: { name: 'Quota Mensile' }
    });
    
    if (!paymentType) {
      paymentType = await prisma.paymentType.create({
        data: {
          name: 'Quota Mensile',
          description: 'Quota mensile atleta',
          amount: 50.00,
          isRecurring: true,
          recurringMonths: 1
        }
      });
    }

    // Crea pagamenti scaduti per test
    const payments = [
      {
        // Pagamento scaduto da 7 giorni
        organizationId: organization.id,
        athleteId: athlete.id,
        typeId: paymentType.id,
        amount: 50.00,
        dueDate: subDays(new Date(), 7),
        status: 'PENDING' as const,
        notes: 'Test pagamento scaduto'
      },
      {
        // Pagamento scaduto oggi
        organizationId: organization.id,
        athleteId: athlete.id,
        typeId: paymentType.id,
        amount: 50.00,
        dueDate: new Date(),
        status: 'PENDING' as const,
        notes: 'Test pagamento scade oggi'
      }
    ];

    // Crea i pagamenti
    for (const payment of payments) {
      await prisma.payment.create({ data: payment });
      console.log(`✅ Creato pagamento scaduto il ${payment.dueDate.toLocaleDateString('it-IT')}`);
    }

    console.log('\n✅ Dati di test creati con successo!');
    console.log('📋 Riassunto:');
    console.log(`  - 3 documenti con diverse scadenze`);
    console.log(`  - 2 pagamenti scaduti`);
    console.log('\n🚀 Ora puoi testare le notifiche!');

  } catch (error) {
    console.error('❌ Errore creazione dati test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createTestData();
