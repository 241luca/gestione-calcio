// Script per aggiornare tutti i limiti di paginazione
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function updateLimits() {
  console.log('🔧 AGGIORNAMENTO LIMITI DI PAGINAZIONE\n');

  try {
    // Conta i dati
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      return;
    }

    const counts = {
      athletes: await prisma.athlete.count({ where: { organizationId: organization.id } }),
      documents: await prisma.document.count({ where: { organizationId: organization.id } }),
      payments: await prisma.payment.count({ where: { organizationId: organization.id } })
    };

    console.log('📊 DATI NEL DATABASE:');
    console.log(`⚽ Atleti: ${counts.athletes}`);
    console.log(`📄 Documenti: ${counts.documents}`);
    console.log(`💰 Pagamenti: ${counts.payments}\n`);

    // Calcola i limiti ottimali
    const limits = {
      athletes: Math.max(counts.athletes + 100, 500),
      documents: Math.max(counts.documents + 100, 1000),
      payments: Math.max(counts.payments + 100, 3000)
    };

    console.log('🎯 NUOVI LIMITI CONSIGLIATI:');
    console.log(`⚽ Atleti: ${limits.athletes}`);
    console.log(`📄 Documenti: ${limits.documents}`);
    console.log(`💰 Pagamenti: ${limits.payments}\n`);

    // File da aggiornare
    const files = [
      {
        path: path.join(__dirname, '../services/document.service.ts'),
        name: 'document.service.ts',
        search: 'limit = 20',
        replace: `limit = ${limits.documents}`
      },
      {
        path: path.join(__dirname, '../services/payment.service.ts'),
        name: 'payment.service.ts',
        search: 'limit = 50',
        replace: `limit = ${limits.payments}`
      }
    ];

    // Aggiorna i file se esistono
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        let content = fs.readFileSync(file.path, 'utf8');
        if (content.includes(file.search)) {
          content = content.replace(file.search, file.replace);
          fs.writeFileSync(file.path, content);
          console.log(`✅ Aggiornato ${file.name}`);
        } else {
          console.log(`⚠️  ${file.name} non contiene '${file.search}'`);
        }
      } else {
        console.log(`❌ File non trovato: ${file.name}`);
      }
    }

    console.log('\n✨ COMPLETATO! Riavvia il backend per applicare le modifiche.');

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLimits();
