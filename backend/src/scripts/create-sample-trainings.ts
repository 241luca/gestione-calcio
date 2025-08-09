// Script per creare allenamenti di esempio
import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function createSampleTrainings() {
  console.log('🏃 CREAZIONE ALLENAMENTI DI ESEMPIO\n');
  console.log('=====================================\n');

  try {
    // Trova l'organizzazione
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ Nessuna organizzazione trovata!');
      return;
    }

    // Trova i team
    const teams = await prisma.team.findMany({
      where: { organizationId: org.id },
      take: 5
    });

    if (teams.length === 0) {
      console.error('❌ Nessun team trovato! Creane almeno uno prima.');
      return;
    }

    console.log(`📋 Trovati ${teams.length} team\n`);

    // Array di allenamenti da creare
    const trainingsToCreate = [];
    const today = new Date();
    
    // Per ogni team, crea allenamenti per le prossime 2 settimane
    for (const team of teams) {
      console.log(`🏃 Creazione allenamenti per ${team.name}:`);
      
      // Lunedì, Mercoledì, Venerdì alle 18:00
      for (let week = 0; week < 2; week++) {
        for (const dayOffset of [1, 3, 5]) { // Lun, Mer, Ven
          const baseDate = addDays(today, week * 7 + dayOffset);
          const trainingDate = setMinutes(setHours(baseDate, 18), 0);
          
          const startTime = new Date(trainingDate);
          startTime.setHours(18, 0, 0, 0);
          const endTime = new Date(trainingDate);
          endTime.setHours(19, 30, 0, 0);
          
          trainingsToCreate.push({
            organizationId: org.id,
            teamId: team.id,
            date: trainingDate,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            type: dayOffset === 5 ? 'Rifinitura' : 'Allenamento',
            location: dayOffset === 3 ? 'Campo B' : 'Campo principale',
            notes: dayOffset === 5 
              ? 'Rifinitura pre-partita. Focus su schemi e calci piazzati.'
              : dayOffset === 3 
              ? 'Allenamento tattico. Lavoro su possesso palla e transizioni.'
              : 'Allenamento completo. Riscaldamento, tecnica, partitella finale.'
          });
        }
      }
      
      // Aggiungi un allenamento speciale per oggi (se non è domenica)
      if (today.getDay() !== 0) {
        const todayTraining = setMinutes(setHours(today, 17), 30);
        const todayStart = new Date(todayTraining);
        todayStart.setHours(17, 30, 0, 0);
        const todayEnd = new Date(todayTraining);
        todayEnd.setHours(19, 0, 0, 0);
        
        trainingsToCreate.push({
          organizationId: org.id,
          teamId: team.id,
          date: todayTraining,
          startTime: todayStart.toISOString(),
          endTime: todayEnd.toISOString(),
          type: 'Allenamento',
          location: 'Campo principale',
          notes: 'Allenamento di oggi - Focus su preparazione fisica e tecnica individuale'
        });
      }
    }

    // Crea tutti gli allenamenti
    console.log(`\n📝 Creazione di ${trainingsToCreate.length} allenamenti...`);
    
    let created = 0;
    for (const training of trainingsToCreate) {
      try {
        await prisma.trainingSession.create({
          data: training
        });
        created++;
      } catch (error) {
        // Ignora errori di duplicati
      }
    }

    console.log(`\n✅ Creati ${created} nuovi allenamenti!`);

    // Mostra riepilogo
    const totalTrainings = await prisma.trainingSession.count({
      where: { organizationId: org.id }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTrainings = await prisma.trainingSession.count({
      where: {
        organizationId: org.id,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const futureTrainings = await prisma.trainingSession.count({
      where: {
        organizationId: org.id,
        date: { gt: todayEnd }
      }
    });

    console.log('\n📊 RIEPILOGO FINALE:');
    console.log('====================');
    console.log(`📅 Allenamenti totali: ${totalTrainings}`);
    console.log(`🏃 Allenamenti oggi: ${todayTrainings}`);
    console.log(`📆 Allenamenti futuri: ${futureTrainings}`);
    
    console.log('\n💡 ORA PUOI:');
    console.log('1. Andare su Menu → Calendario');
    console.log('2. Vedere tutti gli allenamenti nel calendario');
    console.log('3. Aggiungere, modificare o eliminare allenamenti');
    console.log('4. Registrare le presenze degli atleti');

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTrainings();
