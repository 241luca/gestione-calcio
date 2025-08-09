// backend/src/scripts/fix-admin-user.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fix Admin User Organization...');

  try {
    // 1. Trova l'organizzazione
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata!');
      process.exit(1);
    }
    
    console.log(`✅ Organizzazione: ${organization.name}`);
    console.log(`📝 Organization ID: ${organization.id}`);
    
    // 2. Aggiorna l'utente admin
    const email = 'admin@juventusacademymilano.it';
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('⚠️ Utente non trovato, lo creo...');
      
      // Crea il ruolo se non esiste
      let adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
      });
      
      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            description: 'Amministratore'
          }
        });
      }
      
      // Crea l'utente
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Sistema',
          organizationId: organization.id,
          roleId: adminRole.id,
          isActive: true,
          emailVerified: true
        }
      });
      
      console.log('✅ Utente creato con successo!');
    } else {
      // Aggiorna l'utente esistente
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          organizationId: organization.id 
        }
      });
      
      console.log('✅ Utente aggiornato con organization ID!');
    }
    
    // 3. Mostra statistiche
    console.log('\n📊 Verifica dati nel database:');
    
    const stats = await Promise.all([
      prisma.athlete.count({ where: { organizationId: organization.id } }),
      prisma.document.count({ where: { organizationId: organization.id } }),
      prisma.payment.count({ where: { organizationId: organization.id } }),
      prisma.team.count({ where: { organizationId: organization.id } }),
      prisma.staff.count({ where: { organizationId: organization.id } })
    ]);
    
    console.log(`  Atleti: ${stats[0]}`);
    console.log(`  Documenti: ${stats[1]}`);
    console.log(`  Pagamenti: ${stats[2]}`);
    console.log(`  Team: ${stats[3]}`);
    console.log(`  Staff: ${stats[4]}`);
    
    console.log('\n✅ IMPORTANTE:');
    console.log('1. Fai logout dall\'applicazione');
    console.log('2. Fai login di nuovo con:');
    console.log(`   Email: ${email}`);
    console.log('   Password: password123');
    console.log(`3. Ora l'organizationId sarà salvato correttamente!`);
    
    console.log(`\n📌 Organization ID da usare: ${organization.id}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
