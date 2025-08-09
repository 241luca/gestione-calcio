const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('🚀 CREAZIONE UTENTE DEMO FORZATA\n');
  
  try {
    // 1. Elimina vecchio utente demo se esiste
    await prisma.user.deleteMany({
      where: { email: 'demo@soccermanager.com' }
    });
    console.log('✅ Vecchio utente demo eliminato (se esisteva)');
    
    // 2. Crea o trova organizzazione
    let org = await prisma.organization.findFirst();
    
    if (!org) {
      org = await prisma.organization.create({
        data: {
          id: 'org-1',
          name: 'Demo Organization',
          taxCode: '12345678901',
          address: 'Via Demo 1',
          city: 'Milano',
          zipCode: '20100'
        }
      });
      console.log('✅ Organizzazione creata: org-1');
    } else {
      console.log(`✅ Organizzazione esistente: ${org.id}`);
    }
    
    // 3. Crea o trova ruolo admin
    let role = await prisma.role.findFirst({
      where: { 
        name: 'admin',
        organizationId: org.id
      }
    });
    
    if (!role) {
      role = await prisma.role.create({
        data: {
          id: 'role-admin-' + Date.now(),
          name: 'admin',
          description: 'Administrator',
          organizationId: org.id,
          permissions: ['*']
        }
      });
      console.log('✅ Ruolo admin creato');
    } else {
      console.log(`✅ Ruolo esistente: ${role.id}`);
    }
    
    // 4. Hash password
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    console.log('✅ Password hashata');
    
    // 5. Crea nuovo utente demo
    const user = await prisma.user.create({
      data: {
        id: 'user-demo-' + Date.now(),
        email: 'demo@soccermanager.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        organizationId: org.id,
        roleId: role.id,
        isActive: true
      }
    });
    
    console.log('\n✅ UTENTE DEMO CREATO CON SUCCESSO!\n');
    console.log('📋 DETTAGLI:');
    console.log('   Email: demo@soccermanager.com');
    console.log('   Password: demo123456');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Organization ID: ${org.id}`);
    console.log(`   Role ID: ${role.id}`);
    
    // 6. Test password
    const testPassword = await bcrypt.compare('demo123456', user.password);
    console.log(`\n🧪 Test password: ${testPassword ? '✅ PASS' : '❌ FAIL'}`);
    
    // 7. Mostra tutti gli utenti
    console.log('\n📋 TUTTI GLI UTENTI NEL DATABASE:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        isActive: true
      }
    });
    
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - Active: ${u.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
createDemoUser();
