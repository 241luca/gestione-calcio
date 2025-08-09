// Script per contare TUTTI i dati nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countAllData() {
  console.log('📊 CONTEGGIO COMPLETO DATI NEL DATABASE\n');
  console.log('========================================\n');

  try {
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      process.exit(1);
    }
    
    console.log(`🏢 Organizzazione: ${organization.name}`);
    console.log(`📝 ID: ${organization.id}\n`);
    
    // Conta TUTTI i tipi di dati
    const counts = {
      athletes: await prisma.athlete.count({ where: { organizationId: organization.id } }),
      documents: await prisma.document.count({ where: { organizationId: organization.id } }),
      payments: await prisma.payment.count({ where: { organizationId: organization.id } }),
      teams: await prisma.team.count({ where: { organizationId: organization.id } }),
      staff: await prisma.staff.count({ where: { organizationId: organization.id } }),
      matches: await prisma.match.count({ where: { organizationId: organization.id } }),
      trainingSessions: await prisma.trainingSession.count({ where: { organizationId: organization.id } }),
      notifications: await prisma.notification.count({ where: { organizationId: organization.id } }),
      notificationTemplates: await prisma.notificationTemplate.count({ where: { organizationId: organization.id } }),
      injuries: await prisma.injury.count(),
      matchRoster: await prisma.matchRoster.count(),
      matchStats: await prisma.matchStats.count(),
      trainingAttendance: await prisma.trainingAttendance.count(),
      performanceScores: await prisma.performanceScore.count(),
      competitions: await prisma.competition.count({ where: { organizationId: organization.id } }),
      venues: await prisma.venue.count({ where: { organizationId: organization.id } }),
      sponsors: await prisma.sponsor.count({ where: { organizationId: organization.id } }),
      transportZones: await prisma.transportZone.count({ where: { organizationId: organization.id } })
    };
    
    console.log('📈 DATI PRINCIPALI:');
    console.log('=====================================');
    console.log(`⚽ Atleti:              ${counts.athletes}`);
    console.log(`📄 Documenti:           ${counts.documents}`);
    console.log(`💰 Pagamenti:           ${counts.payments}`);
    console.log(`👥 Team:                ${counts.teams}`);
    console.log(`🏋️ Staff:               ${counts.staff}`);
    console.log(`⚔️ Partite:             ${counts.matches}`);
    console.log(`🏃 Allenamenti:         ${counts.trainingSessions}`);
    console.log('=====================================\n');
    
    console.log('📊 DATI SECONDARI:');
    console.log('=====================================');
    console.log(`🔔 Notifiche:           ${counts.notifications}`);
    console.log(`📝 Template Notifiche:  ${counts.notificationTemplates}`);
    console.log(`🏥 Infortuni:           ${counts.injuries}`);
    console.log(`📋 Convocazioni:        ${counts.matchRoster}`);
    console.log(`📈 Statistiche Partite: ${counts.matchStats}`);
    console.log(`✅ Presenze Training:   ${counts.trainingAttendance}`);
    console.log(`⭐ Performance Scores:  ${counts.performanceScores}`);
    console.log(`🏆 Competizioni:        ${counts.competitions}`);
    console.log(`🏟️ Campi:               ${counts.venues}`);
    console.log(`💼 Sponsor:             ${counts.sponsors}`);
    console.log(`🚌 Zone Trasporto:      ${counts.transportZones}`);
    console.log('=====================================\n');
    
    // Analisi limiti necessari
    console.log('⚠️ ATTENZIONE - MODULI CHE POTREBBERO NECESSITARE LIMITI MAGGIORI:');
    console.log('================================================================');
    
    Object.entries(counts).forEach(([key, value]) => {
      if (value > 100) {
        const emoji = value > 1000 ? '🔴' : value > 500 ? '🟡' : '🟢';
        console.log(`${emoji} ${key}: ${value} record - Verifica il limite!`);
      }
    });
    
    console.log('\n✅ ANALISI COMPLETATA!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countAllData();
