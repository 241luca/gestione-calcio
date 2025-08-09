const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndFixUsers() {
  console.log('🔍 Checking database users...\n');
  
  try {
    // 1. Lista tutti gli utenti esistenti
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true
      }
    });
    
    console.log('📋 Utenti trovati nel database:');
    if (users.length === 0) {
      console.log('   ❌ Nessun utente trovato!');
    } else {
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Organization: ${user.organizationId}`);
      });
    }
    
    // 2. Cerca specificamente l'utente demo
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' }
    });
    
    console.log('\n🔍 Controllo utente demo:');
    if (demoUser) {
      console.log('   ✅ Utente demo esiste');
      
      // Verifica password
      const passwordCorrect = await bcrypt.compare('demo123456', demoUser.password);
      if (passwordCorrect) {
        console.log('   ✅ Password corretta');
      } else {
        console.log('   ❌ Password non corrisponde, aggiorno...');
        
        // Aggiorna password
        const hashedPassword = await bcrypt.hash('demo123456', 10);
        await prisma.user.update({
          where: { id: demoUser.id },
          data: { password: hashedPassword }
        });
        console.log('   ✅ Password aggiornata!');
      }
    } else {
      console.log('   ❌ Utente demo non trovato, lo creo...');
      
      // Prima verifica che esista l'organizzazione
      let organization = await prisma.organization.findFirst();
      
      if (!organization) {
        console.log('   📦 Creo prima l\'organizzazione...');
        organization = await prisma.organization.create({
          data: {
            id: 'org-1',
            name: 'ASD Calcio Demo',
            taxCode: '12345678901',
            address: 'Via Demo, 1',
            city: 'Milano',
            zipCode: '20100',
            phone: '+39 02 12345678',
            email: 'info@asddemo.it'
          }
        });
        console.log('   ✅ Organizzazione creata');
      }
      
      // Verifica che esista un ruolo
      let adminRole = await prisma.role.findFirst({
        where: { 
          name: 'admin',
          organizationId: organization.id
        }
      });
      
      if (!adminRole) {
        console.log('   📦 Creo ruolo admin...');
        adminRole = await prisma.role.create({
          data: {
            id: 'role-admin',
            name: 'admin',
            description: 'Amministratore',
            organizationId: organization.id
          }
        });
        console.log('   ✅ Ruolo admin creato');
      }
      
      // Crea utente demo
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      const newUser = await prisma.user.create({
        data: {
          email: 'demo@soccermanager.com',
          password: hashedPassword,
          firstName: 'Demo',
          lastName: 'User',
          organizationId: organization.id,
          roleId: adminRole.id,
          isActive: true
        }
      });
      
      console.log('   ✅ Utente demo creato con successo!');
      console.log(`      Email: ${newUser.email}`);
      console.log(`      Password: demo123456`);
      console.log(`      Organization: ${newUser.organizationId}`);
    }
    
    // 3. Test login diretto
    console.log('\n🧪 Test login con le credenziali:');
    const testUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' }
    });
    
    if (testUser) {
      const testPassword = await bcrypt.compare('demo123456', testUser.password);
      if (testPassword) {
        console.log('   ✅ Login test superato!');
        console.log('\n📝 CREDENZIALI FUNZIONANTI:');
        console.log('   Email: demo@soccermanager.com');
        console.log('   Password: demo123456');
        console.log(`   Organization ID: ${testUser.organizationId}`);
      } else {
        console.log('   ❌ Password non valida');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
checkAndFixUsers();
