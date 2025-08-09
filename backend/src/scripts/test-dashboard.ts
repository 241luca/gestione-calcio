// Script per testare gli endpoint della dashboard
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardData() {
  console.log('🔍 TEST DATI DASHBOARD\n');
  console.log('=======================\n');

  try {
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      return;
    }

    console.log(`🏢 Organizzazione: ${organization.name}\n`);

    // 1. ATLETI
    const athletes = await prisma.athlete.findMany({
      where: { organizationId: organization.id }
    });
    
    const activeAthletes = athletes.filter(a => a.status === 'ACTIVE');
    
    console.log('⚽ ATLETI:');
    console.log(`   Totali: ${athletes.length}`);
    console.log(`   Attivi: ${activeAthletes.length}`);
    console.log(`   Inattivi: ${athletes.filter(a => a.status === 'INACTIVE').length}`);
    console.log(`   Infortunati: ${athletes.filter(a => a.status === 'INJURED').length}\n`);

    // 2. DOCUMENTI
    const allDocuments = await prisma.document.findMany({
      where: { organizationId: organization.id }
    });

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const expiringDocs = allDocuments.filter(doc => {
      if (!doc.expiryDate) return false;
      return doc.expiryDate >= now && doc.expiryDate <= in30Days;
    });

    const expiredDocs = allDocuments.filter(doc => {
      if (!doc.expiryDate) return false;
      return doc.expiryDate < now;
    });

    console.log('📄 DOCUMENTI:');
    console.log(`   Totali: ${allDocuments.length}`);
    console.log(`   In scadenza (30gg): ${expiringDocs.length}`);
    console.log(`   Scaduti: ${expiredDocs.length}`);
    console.log(`   Validi: ${allDocuments.filter(d => d.status === 'VALID').length}\n`);

    // 3. PAGAMENTI
    const allPayments = await prisma.payment.findMany({
      where: { organizationId: organization.id }
    });

    const overduePayments = allPayments.filter(p => p.status === 'OVERDUE');
    const pendingPayments = allPayments.filter(p => p.status === 'PENDING');

    console.log('💰 PAGAMENTI:');
    console.log(`   Totali: ${allPayments.length}`);
    console.log(`   Scaduti: ${overduePayments.length}`);
    console.log(`   In attesa: ${pendingPayments.length}`);
    console.log(`   Pagati: ${allPayments.filter(p => p.status === 'PAID').length}`);
    
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    console.log(`   Importo scaduto: €${totalOverdue}\n`);

    // 4. PARTITE
    const upcomingMatches = await prisma.match.findMany({
      where: {
        organizationId: organization.id,
        date: { gte: now }
      },
      orderBy: { date: 'asc' },
      take: 5
    });

    console.log('⚽ PARTITE:');
    console.log(`   Prossime: ${upcomingMatches.length}\n`);

    // 5. ALLENAMENTI
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTrainings = await prisma.trainingSession.findMany({
      where: {
        organizationId: organization.id,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    console.log('🏃 ALLENAMENTI:');
    console.log(`   Oggi: ${todayTrainings.length}\n`);

    // RIEPILOGO
    console.log('📊 RIEPILOGO PER DASHBOARD:');
    console.log('============================');
    console.log(`✅ Atleti Totali: ${athletes.length}`);
    console.log(`✅ Atleti Attivi: ${activeAthletes.length}`);
    console.log(`⚠️  Documenti in Scadenza: ${expiringDocs.length}`);
    console.log(`❌ Pagamenti Scaduti: ${overduePayments.length} (€${totalOverdue})`);
    console.log(`📅 Partite Prossime: ${upcomingMatches.length}`);
    console.log(`🏃 Allenamenti Oggi: ${todayTrainings.length}`);
    console.log('============================\n');

    if (expiringDocs.length === 0 && expiredDocs.length === 0 && overduePayments.length === 0) {
      console.log('💡 SUGGERIMENTO: Non ci sono documenti in scadenza o pagamenti scaduti.');
      console.log('   La dashboard potrebbe mostrare 0 per questi valori.\n');
    }

    console.log('✅ TEST COMPLETATO!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardData();
