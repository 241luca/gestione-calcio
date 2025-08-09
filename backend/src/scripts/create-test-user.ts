// backend/src/scripts/create-test-user.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creazione utente di test...');

  try {
    // 1. Recupera o crea Organization
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organizzazione trovata nel database!');
      console.log('Esegui prima: npm run seed');
      process.exit(1);
    }

    console.log(`✅ Organizzazione trovata: ${organization.name} (ID: ${organization.id})`);

    // 2. Recupera o crea Role
    let adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('📌 Creazione ruolo admin...');
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          displayName: 'Amministratore',
          description: 'Accesso completo al sistema'
        }
      });
    }

    // 3. Crea User di test
    const email = 'test@test.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Elimina utente esistente se presente
    await prisma.userOrganization.deleteMany({
      where: { user: { email } }
    });
    
    await prisma.user.deleteMany({
      where: { email }
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '+39 333 1234567',
        isActive: true,
        emailVerified: true,
        roleId: adminRole.id,
        organizations: {
          create: {
            organizationId: organization.id,
            roleId: adminRole.id
          }
        }
      }
    });

    console.log('✅ Utente di test creato!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🏢 Organization ID:', organization.id);
    console.log('');
    console.log('Usa queste credenziali per fare login!');

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
