const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixEverything() {
  console.log('🔧 FIX DEFINITIVO DATABASE - Soccer Management\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. TROVA L'ORGANIZZAZIONE
    console.log('\n1️⃣ Cerco organizzazione...');
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      console.error('❌ Nessuna organizzazione trovata! Creazione...');
      org = await prisma.organization.create({
        data: {
          name: 'Demo Soccer Club',
          taxCode: '12345678901',
          address: 'Via Demo 1',
          city: 'Milano',
          zipCode: '20100'
        }
      });
    }
    console.log(`✅ Organizzazione: ${org.id}`);
    
    // 2. GESTISCI I RUOLI
    console.log('\n2️⃣ Controllo ruoli...');
    
    // Prima cerca QUALSIASI ruolo admin esistente (anche di altre org)
    const existingAdminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });
    
    let role;
    
    if (existingAdminRole) {
      console.log('⚠️  Esiste già un ruolo admin, lo uso...');
      
      // Se è di un'altra org, cerco un ruolo per la nostra org
      if (existingAdminRole.organizationId !== org.id) {
        role = await prisma.role.findFirst({
          where: { organizationId: org.id }
        });
        
        if (!role) {
          // Crea un ruolo con nome diverso
          role = await prisma.role.create({
            data: {
              name: `admin_${Date.now()}`, // Nome univoco
              description: 'Administrator',
              organizationId: org.id,
              permissions: ['*']
            }
          });
          console.log(`✅ Creato nuovo ruolo: ${role.name}`);
        } else {
          console.log(`✅ Uso ruolo esistente: ${role.name}`);
        }
      } else {
        role = existingAdminRole;
        console.log(`✅ Uso ruolo admin esistente per questa org`);
      }
    } else {
      // Nessun ruolo admin esiste, crealo
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
    
    // 3. GESTISCI L'UTENTE DEMO
    console.log('\n3️⃣ Gestione utente demo...');
    
    // Elimina vecchi utenti demo
    const deleted = await prisma.user.deleteMany({
      where: { email: 'demo@soccermanager.com' }
    });
    
    if (deleted.count > 0) {
      console.log(`✅ Eliminati ${deleted.count} vecchi utenti demo`);
    }
    
    // 4. CREA NUOVO UTENTE DEMO
    console.log('\n4️⃣ Creazione nuovo utente demo...');
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    
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
    
    console.log('✅ Utente demo creato!');
    
    // 5. VERIFICA FINALE
    console.log('\n5️⃣ Verifica finale...');
    
    // Test password
    const passwordOk = await bcrypt.compare('demo123456', user.password);
    console.log(`   Password test: ${passwordOk ? '✅' : '❌'}`);
    
    // Test recupero utente
    const checkUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' },
      include: { 
        role: true, 
        organization: true 
      }
    });
    
    if (checkUser && checkUser.isActive) {
      console.log(`   Utente attivo: ✅`);
      console.log(`   Organizzazione: ${checkUser.organization.name}`);
      console.log(`   Ruolo: ${checkUser.role.name}`);
    } else {
      console.log(`   Utente attivo: ❌`);
    }
    
    // RISULTATO FINALE
    console.log('\n' + '=' .repeat(50));
    console.log('✨ SISTEMA CONFIGURATO CON SUCCESSO! ✨');
    console.log('=' .repeat(50));
    console.log('\n📋 CREDENZIALI DI LOGIN:');
    console.log('   Email: demo@soccermanager.com');
    console.log('   Password: demo123456');
    console.log(`   Organization ID: ${org.id}`);
    console.log('\n🚀 Ora puoi fare login su http://localhost:5173');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    
    // Se è un errore di connessione database
    if (error.message.includes('P1001') || error.message.includes('connect')) {
      console.error('\n⚠️  Il database non è raggiungibile!');
      console.error('Assicurati che PostgreSQL sia attivo.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
fixEverything();
