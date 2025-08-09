const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  console.log('🔧 FIX PERMESSI UTENTE DEMO\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Trova l'utente demo
    const user = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' },
      include: {
        role: true,
        organization: true
      }
    });
    
    if (!user) {
      console.error('❌ Utente demo non trovato!');
      console.log('Esegui prima: node fix-everything.js');
      return;
    }
    
    console.log('✅ Utente trovato:', user.email);
    console.log('   Organization:', user.organization.name);
    console.log('   Ruolo attuale:', user.role?.name || 'NESSUNO');
    console.log('   Permessi attuali:', user.role?.permissions || []);
    
    // 2. Aggiorna il ruolo con tutti i permessi
    if (user.role) {
      console.log('\n📝 Aggiornamento permessi ruolo...');
      
      const updatedRole = await prisma.role.update({
        where: { id: user.role.id },
        data: {
          permissions: [
            '*', // Tutti i permessi
            'athletes:*',
            'documents:*', 
            'payments:*',
            'teams:*',
            'matches:*',
            'notifications:*',
            'settings:*',
            'reports:*'
          ],
          description: 'Amministratore con tutti i permessi'
        }
      });
      
      console.log('✅ Ruolo aggiornato con tutti i permessi');
      console.log('   Nuovi permessi:', updatedRole.permissions);
    } else {
      // Crea un nuovo ruolo admin
      console.log('\n📝 Creazione nuovo ruolo admin...');
      
      const newRole = await prisma.role.create({
        data: {
          name: `admin_full_${Date.now()}`,
          description: 'Amministratore con tutti i permessi',
          organizationId: user.organizationId,
          permissions: [
            '*', // Tutti i permessi
            'athletes:*',
            'documents:*',
            'payments:*',
            'teams:*',
            'matches:*',
            'notifications:*',
            'settings:*',
            'reports:*'
          ]
        }
      });
      
      // Assegna il ruolo all'utente
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: newRole.id }
      });
      
      console.log('✅ Nuovo ruolo creato e assegnato');
      console.log('   Ruolo:', newRole.name);
      console.log('   Permessi:', newRole.permissions);
    }
    
    // 3. Assicurati che l'utente sia attivo
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        isSuperAdmin: true // Facciamolo super admin per sicurezza
      }
    });
    
    console.log('\n✅ Utente impostato come Super Admin');
    
    // 4. Verifica finale
    const finalUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' },
      include: { role: true }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ PERMESSI SISTEMATI CON SUCCESSO! ✨');
    console.log('=' .repeat(50));
    console.log('\n📋 CONFIGURAZIONE FINALE:');
    console.log('   Email: demo@soccermanager.com');
    console.log('   Password: demo123456');
    console.log('   Super Admin: ' + (finalUser.isSuperAdmin ? '✅ SI' : '❌ NO'));
    console.log('   Ruolo: ' + finalUser.role?.name);
    console.log('   Permessi: ' + (finalUser.role?.permissions?.join(', ') || 'NESSUNO'));
    console.log('\n🚀 Ora dovresti poter accedere a tutto!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
fixPermissions();
