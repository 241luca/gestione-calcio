// Script per verificare gli allenamenti nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrainings() {
  console.log('🏃 VERIFICA ALLENAMENTI NEL DATABASE\n');
  console.log('=====================================\n');

  try {
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      console.error('❌ Nessuna organizzazione trovata!');
      return;
    }

    // Conta allenamenti totali
    const totalTrainings = await prisma.trainingSession.count({ 
      where: { organizationId: org.id } 
    });
    
    // Allenamenti futuri
    const upcomingTrainings = await prisma.trainingSession.findMany({
      where: { 
        organizationId: org.id,
        date: { gte: new Date() }
      },
      include: {
        team: true
      },
      orderBy: { date: 'asc' },
      take: 10
    });
    
    // Allenamenti di oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTrainings = await prisma.trainingSession.findMany({
      where: {
        organizationId: org.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        team: true
      }
    });
    
    // Allenamenti passati (ultimi 10)
    const pastTrainings = await prisma.trainingSession.findMany({
      where: { 
        organizationId: org.id,
        date: { lt: new Date() }
      },
      include: {
        team: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Report
    console.log('📊 STATISTICHE:');
    console.log(`   Allenamenti totali: ${totalTrainings}`);
    console.log(`   Allenamenti oggi: ${todayTrainings.length}`);
    console.log(`   Allenamenti futuri: ${upcomingTrainings.length}`);
    console.log(`   Allenamenti passati: ${pastTrainings.length} (ultimi 10)\n`);
    
    if (todayTrainings.length > 0) {
      console.log('🏃 ALLENAMENTI DI OGGI:');
      todayTrainings.forEach(t => {
        console.log(`   - ${t.team?.name || 'Team'} alle ${t.time || 'orario da definire'}`);
      });
      console.log('');
    }
    
    if (upcomingTrainings.length > 0) {
      console.log('📅 PROSSIMI ALLENAMENTI:');
      upcomingTrainings.forEach(t => {
        const date = new Date(t.date);
        console.log(`   - ${date.toLocaleDateString('it-IT')} - ${t.team?.name || 'Team'} - ${t.type || 'Allenamento'}`);
      });
    } else {
      console.log('ℹ️ Nessun allenamento futuro programmato');
    }
    
    console.log('\n💡 SUGGERIMENTO:');
    console.log('   Per gestire gli allenamenti, vai su:');
    console.log('   Menu → Calendario (icona calendario 📅)');
    console.log('   Lì puoi vedere e gestire sia partite che allenamenti!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainings();
