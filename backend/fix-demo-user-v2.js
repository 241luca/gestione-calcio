const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('🚀 CREAZIONE UTENTE DEMO - VERSIONE CORRETTA\n');
  
  try {
    // 1. Trova l'organizzazione esistente
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      console.error('❌ Nessuna organizzazione trovata!');
      console.log('Creo una nuova organizzazione...');
      org = await prisma.organization.create({
        data: {
          name: 'Demo Organization',
          taxCode: '12345678901',
          address: 'Via Demo 1',
          city: 'Milano',
          zipCode: '20100'
        }
      });
    }
    
    console.log(`✅ Organizzazione trovata: ${org.id}`);
    
    // 2. Trova o crea il ruolo admin per questa organizzazione
    let role = await prisma.role.findFirst({
      where: { 
        name: 'admin',
        organizationId: org.id
      }
    });
    
    if (!role) {
      console.log('📦 Ruolo admin non trovato, lo creo...');
      
      // Prima prova a trovare qualsiasi ruolo per questa org
      const anyRole = await prisma.role.findFirst({
        where: { organizationId: org.id }
      });
      
      if (anyRole) {
        role = anyRole;
        console.log(`✅ Uso ruolo esistente: ${role.name} (${role.id})`);
      } else {
        // Crea nuovo ruolo con ID univoco
        role = await prisma.role.create({
          data: {
            name: 'admin',
            description: 'Administrator',
            organizationId: org.id,
            permissions: ['*']
          }
        });
        console.log('✅ Ruolo admin creato');
      }
    } else {
      console.log(`✅ Ruolo admin esistente: ${role.id}`);
    }
    
    // 3. Elimina vecchio utente demo se esiste
    const deletedCount = await prisma.user.deleteMany({
      where: { email: 'demo@soccermanager.com' }
    });
    
    if (deletedCount.count > 0) {
      console.log(`✅ Eliminati ${deletedCount.count} utenti demo esistenti`);
    }
    
    // 4. Hash password
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    console.log('✅ Password hashata');
    
    // 5. Crea nuovo utente demo
    const user = await prisma.user.create({
      data: {
        email: 'demo@soccermanager.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        organizationId: org.id,
        roleId: role.id,
        isActive: true
      }
    });
    
    console.log('\n✨✨✨ UTENTE DEMO CREATO CON SUCCESSO! ✨✨✨\n');
    console.log('📋 CREDENZIALI DI LOGIN:');
    console.log('================================');
    console.log('   Email: demo@soccermanager.com');
    console.log('   Password: demo123456');
    console.log('================================\n');
    console.log('📊 DETTAGLI TECNICI:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Organization ID: ${org.id}`);
    console.log(`   Role: ${role.name} (${role.id})`);
    
    // 6. Test password per sicurezza
    const testPassword = await bcrypt.compare('demo123456', user.password);
    console.log(`\n🧪 Test password: ${testPassword ? '✅ PASS' : '❌ FAIL'}`);
    
    // 7. Test che l'utente sia recuperabile
    const checkUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' },
      include: { role: true, organization: true }
    });
    
    if (checkUser) {
      console.log('\n✅ VERIFICA FINALE: Utente recuperabile dal database');
      console.log(`   Organizzazione: ${checkUser.organization.name}`);
      console.log(`   Ruolo: ${checkUser.role.name}`);
      console.log(`   Attivo: ${checkUser.isActive ? 'Sì' : 'No'}`);
    }
    
    // 8. Mostra tutti gli utenti attivi
    console.log('\n📋 TUTTI GLI UTENTI ATTIVI:');
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true
      }
    });
    
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
    });
    
    console.log('\n🎉 TUTTO PRONTO! Ora puoi fare login con le credenziali sopra.');
    
  } catch (error) {
    console.error('\n❌ ERRORE CRITICO:', error.message);
    console.error('Dettagli:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
createDemoUser();
