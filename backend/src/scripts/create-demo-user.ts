// Script per creare utente demo nel database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    console.log('🔄 Creazione utente demo...');

    // Prima creiamo un'organizzazione demo se non esiste
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo Soccer Club' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Demo Soccer Club',
          taxCode: 'DEMO123456789',
          address: 'Via Demo 1',
          city: 'Milano',
          province: 'MI',
          zipCode: '20100',
          email: 'info@demosoccerclub.com',
          phone: '+39 02 1234567'
        }
      });
      console.log('✅ Organizzazione demo creata');
    }

    // Creiamo un ruolo admin se non esiste
    let adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Amministratore con tutti i permessi',
          permissions: ['*:*'] // Tutti i permessi
        }
      });
      console.log('✅ Ruolo admin creato');
    }

    // Verifica se l'utente demo esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@soccermanager.com' }
    });

    if (existingUser) {
      console.log('⚠️  Utente demo già esistente');
      // Aggiorniamo la password
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Password utente demo aggiornata');
    } else {
      // Creiamo l'utente demo
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      
      const demoUser = await prisma.user.create({
        data: {
          email: 'demo@soccermanager.com',
          password: hashedPassword,
          firstName: 'Demo',
          lastName: 'User',
          phone: '+39 333 1234567',
          organizationId: organization.id,
          roleId: adminRole.id,
          isActive: true
        }
      });

      console.log('✅ Utente demo creato con successo!');
      console.log('📧 Email: demo@soccermanager.com');
      console.log('🔑 Password: demo123456');
    }

    // Creiamo anche alcuni tipi di pagamento se non esistono
    const paymentTypes = [
      { name: 'Quota Iscrizione', description: 'Quota annuale di iscrizione', amount: 150, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Quota Mensile', description: 'Quota mensile', amount: 50, isRecurring: true, frequency: 'MONTHLY' },
      { name: 'Kit Divisa', description: 'Kit completo divisa da gioco', amount: 80, isRecurring: false, frequency: 'ONE_TIME' },
      { name: 'Assicurazione', description: 'Quota assicurativa annuale', amount: 30, isRecurring: false, frequency: 'YEARLY' }
    ];

    for (const type of paymentTypes) {
      const existing = await prisma.paymentType.findFirst({
        where: { name: type.name }
      });

      if (!existing) {
        await prisma.paymentType.create({
          data: type
        });
        console.log(`✅ Tipo pagamento "${type.name}" creato`);
      }
    }

    // Creiamo alcuni tipi di documento se non esistono
    const documentTypes = [
      { name: 'Certificato Medico', description: 'Certificato medico sportivo', isRequired: true, hasExpiry: true, validityDays: 365 },
      { name: 'Documento Identità', description: 'Carta identità o passaporto', isRequired: true, hasExpiry: true, validityDays: 1825 },
      { name: 'Codice Fiscale', description: 'Tessera codice fiscale', isRequired: true, hasExpiry: false },
      { name: 'Foto Tessera', description: 'Fototessera per tesserino', isRequired: true, hasExpiry: false }
    ];

    for (const type of documentTypes) {
      const existing = await prisma.documentType.findFirst({
        where: { name: type.name }
      });

      if (!existing) {
        await prisma.documentType.create({
          data: type
        });
        console.log(`✅ Tipo documento "${type.name}" creato`);
      }
    }

    // Creiamo alcune squadre di esempio se non esistono
    const teams = [
      { name: 'Primi Calci 2016', category: 'Primi Calci', season: '2024/2025', coach: 'Mario Rossi' },
      { name: 'Pulcini 2014', category: 'Pulcini', season: '2024/2025', coach: 'Giuseppe Verdi' },
      { name: 'Esordienti 2012', category: 'Esordienti', season: '2024/2025', coach: 'Antonio Bianchi' },
      { name: 'Giovanissimi 2010', category: 'Giovanissimi', season: '2024/2025', coach: 'Francesco Neri' }
    ];

    for (const team of teams) {
      const existing = await prisma.team.findFirst({
        where: { 
          name: team.name,
          organizationId: organization.id
        }
      });

      if (!existing) {
        await prisma.team.create({
          data: {
            ...team,
            organizationId: organization.id
          }
        });
        console.log(`✅ Squadra "${team.name}" creata`);
      }
    }

    console.log('\n🎉 Setup completato con successo!');
    console.log('\n📝 Credenziali di accesso:');
    console.log('   Email: demo@soccermanager.com');
    console.log('   Password: demo123456');

  } catch (error) {
    console.error('❌ Errore durante la creazione utente demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createDemoUser();
