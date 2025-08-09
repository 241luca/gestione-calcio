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
    
    // Conta TUTTI i tipi di dati (solo quelli che esistono realmente)
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
      competitions: await prisma.competition.count({ where: { organizationId: organization.id } }),
      venues: await prisma.venue.count({ where: { organizationId: organization.id } }),
      sponsors: await prisma.sponsor.count({ where: { organizationId: organization.id } }),
      transportZones: await prisma.transportZone.count({ where: { organizationId: organization.id } }),
      // Tabelle di configurazione
      roles: await prisma.role.count(),
      documentTypes: await prisma.documentType.count(),
      paymentTypes: await prisma.paymentType.count(),
      positions: await prisma.position.count(),
      users: await prisma.user.count(),
      userOrganizations: await prisma.userOrganization.count()
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
    console.log(`🏆 Competizioni:        ${counts.competitions}`);
    console.log(`🏟️ Campi:               ${counts.venues}`);
    console.log(`💼 Sponsor:             ${counts.sponsors}`);
    console.log(`🚌 Zone Trasporto:      ${counts.transportZones}`);
    console.log('=====================================\n');
    
    console.log('⚙️ DATI DI CONFIGURAZIONE:');
    console.log('=====================================');
    console.log(`👤 Ruoli:               ${counts.roles}`);
    console.log(`📑 Tipi Documento:      ${counts.documentTypes}`);
    console.log(`💳 Tipi Pagamento:      ${counts.paymentTypes}`);
    console.log(`⚽ Posizioni:           ${counts.positions}`);
    console.log(`👥 Utenti:              ${counts.users}`);
    console.log(`🔗 Utenti-Org:          ${counts.userOrganizations}`);
    console.log('=====================================\n');
    
    // Analisi limiti necessari
    console.log('⚠️ ATTENZIONE - MODULI CHE POTREBBERO NECESSITARE LIMITI MAGGIORI:');
    console.log('================================================================');
    
    const needsAttention: any[] = [];
    
    Object.entries(counts).forEach(([key, value]) => {
      if (value > 100) {
        needsAttention.push({ name: key, count: value });
      }
    });
    
    if (needsAttention.length === 0) {
      console.log('✅ Tutti i moduli hanno meno di 100 record');
    } else {
      needsAttention
        .sort((a, b) => b.count - a.count)
        .forEach(item => {
          const emoji = item.count > 1000 ? '🔴' : item.count > 500 ? '🟡' : '🟢';
          console.log(`${emoji} ${item.name}: ${item.count} record`);
        });
    }
    
    console.log('\n📋 RIEPILOGO LIMITI ATTUALI:');
    console.log('================================');
    console.log(`⚽ Atleti:    limite 400   (hai ${counts.athletes})`);
    console.log(`📄 Documenti: limite 1000  (hai ${counts.documents})`);
    console.log(`💰 Pagamenti: limite 3000  (hai ${counts.payments})`);
    console.log('================================');
    
    // Suggerimenti
    console.log('\n💡 SUGGERIMENTI:');
    if (counts.notifications > 100) {
      console.log(`- Le notifiche (${counts.notifications}) potrebbero necessitare paginazione`);
    }
    if (counts.trainingSessions > 100) {
      console.log(`- Gli allenamenti (${counts.trainingSessions}) potrebbero necessitare paginazione`);
    }
    if (counts.matches > 100) {
      console.log(`- Le partite (${counts.matches}) potrebbero necessitare paginazione`);
    }
    if (counts.matchRoster > 200) {
      console.log(`- Le convocazioni (${counts.matchRoster}) potrebbero necessitare paginazione`);
    }
    if (counts.trainingAttendance > 500) {
      console.log(`- Le presenze allenamento (${counts.trainingAttendance}) potrebbero necessitare paginazione`);
    }
    
    console.log('\n✅ ANALISI COMPLETATA!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countAllData();
