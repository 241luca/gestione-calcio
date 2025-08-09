// backend/src/scripts/fix-user-organization.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fix User Organization ID...');

  try {
    // 1. Trova la prima organizzazione
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      process.exit(1);
    }
    
    console.log(`✅ Organizzazione trovata: ${organization.name} (ID: ${organization.id})`);
    
    // 2. Trova l'utente admin@juventusacademymilano.it
    const user = await prisma.user.findUnique({
      where: { email: 'admin@juventusacademymilano.it' }
    });
    
    if (!user) {
      console.error('❌ Utente admin@juventusacademymilano.it non trovato!');
      
      // Mostra tutti gli utenti
      const allUsers = await prisma.user.findMany({
        select: { email: true, organizationId: true }
      });
      
      console.log('\n📋 Utenti nel database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (Org: ${u.organizationId || 'NESSUNA'})`);
      });
      
      process.exit(1);
    }
    
    // 3. Aggiorna l'utente con l'organizationId
    if (!user.organizationId || user.organizationId !== organization.id) {
      console.log(`⚠️ Utente ha organizationId: ${user.organizationId || 'NULLO'}`);
      console.log(`📝 Aggiornamento a: ${organization.id}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id }
      });
      
      console.log('✅ Utente aggiornato con successo!');
    } else {
      console.log('✅ Utente già configurato correttamente');
    }
    
    // 4. Mostra statistiche
    const athleteCount = await prisma.athlete.count({
      where: { organizationId: organization.id }
    });
    
    const documentCount = await prisma.document.count({
      where: { organizationId: organization.id }
    });
    
    const paymentCount = await prisma.payment.count({
      where: { organizationId: organization.id }
    });
    
    console.log('\n📊 Statistiche per questa organizzazione:');
    console.log(`  - Atleti: ${athleteCount}`);
    console.log(`  - Documenti: ${documentCount}`);
    console.log(`  - Pagamenti: ${paymentCount}`);
    
    console.log('\n✅ Ora prova a fare login con:');
    console.log('  Email: admin@juventusacademymilano.it');
    console.log('  Password: password123');
    console.log(`  Organization ID sarà: ${organization.id}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
