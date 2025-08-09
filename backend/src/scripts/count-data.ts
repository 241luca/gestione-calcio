// backend/src/scripts/count-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 CONTEGGIO DATI NEL DATABASE\n');

  try {
    // Trova l'organizzazione
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      process.exit(1);
    }
    
    console.log(`🏢 Organizzazione: ${organization.name}`);
    console.log(`📝 ID: ${organization.id}\n`);
    
    // Conta tutti i dati
    const counts = await Promise.all([
      prisma.athlete.count({ where: { organizationId: organization.id } }),
      prisma.athlete.count(), // Totale generale
      prisma.document.count({ where: { organizationId: organization.id } }),
      prisma.payment.count({ where: { organizationId: organization.id } }),
      prisma.team.count({ where: { organizationId: organization.id } }),
      prisma.staff.count({ where: { organizationId: organization.id } })
    ]);
    
    console.log('📈 STATISTICHE:');
    console.log('=====================================');
    console.log(`⚽ ATLETI per questa org: ${counts[0]}`);
    console.log(`⚽ ATLETI totali nel DB:  ${counts[1]}`);
    console.log(`📄 DOCUMENTI:             ${counts[2]}`);
    console.log(`💰 PAGAMENTI:             ${counts[3]}`);
    console.log(`👥 TEAM:                  ${counts[4]}`);
    console.log(`🏋️ STAFF:                 ${counts[5]}`);
    console.log('=====================================');
    
    if (counts[0] > 200) {
      console.log('\n⚠️  ATTENZIONE: Hai più di 200 atleti!');
      console.log('    Con il limite attuale ne vedrai solo 200.');
      console.log('    Dobbiamo implementare la paginazione.');
    } else if (counts[0] > 50 && counts[0] <= 200) {
      console.log('\n✅ Con il nuovo limite di 200, dovresti vederli tutti!');
    } else {
      console.log('\n✅ Tutti gli atleti dovrebbero essere visibili.');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
