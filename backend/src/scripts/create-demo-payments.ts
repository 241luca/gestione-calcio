// Script per creare pagamenti demo nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoPayments() {
  try {
    console.log('🔄 Creazione pagamenti demo...');

    // Trova l'organizzazione demo
    const organization = await prisma.organization.findFirst({
      where: { name: 'Demo Soccer Club' }
    });

    if (!organization) {
      console.log('❌ Organizzazione demo non trovata. Esegui prima create-demo-user.ts');
      return;
    }

    // Trova un utente demo per createdById
    const demoUser = await prisma.user.findFirst({
      where: { organizationId: organization.id }
    });

    if (!demoUser) {
      console.log('❌ Utente demo non trovato. Esegui prima create-demo-user.ts');
      return;
    }

    // Trova o crea alcuni atleti demo
    let athletes = await prisma.athlete.findMany({
      where: { organizationId: organization.id },
      take: 5
    });

    if (athletes.length === 0) {
      console.log('📝 Creazione atleti demo...');
      
      // Trova una squadra
      const team = await prisma.team.findFirst({
        where: { organizationId: organization.id }
      });

      const athletesData = [
        { firstName: 'Marco', lastName: 'Rossi', birthDate: new Date('2010-03-15'), fiscalCode: 'RSSMRC10C15H501X' },
        { firstName: 'Luca', lastName: 'Bianchi', birthDate: new Date('2011-07-22'), fiscalCode: 'BNCLCU11L22H501Y' },
        { firstName: 'Giuseppe', lastName: 'Verdi', birthDate: new Date('2012-01-10'), fiscalCode: 'VRDGPP12A10H501Z' },
        { firstName: 'Francesco', lastName: 'Neri', birthDate: new Date('2010-09-05'), fiscalCode: 'NREFNC10P05H501W' },
        { firstName: 'Alessandro', lastName: 'Romano', birthDate: new Date('2011-11-30'), fiscalCode: 'RMNLSS11S30H501V' }
      ];

      for (const data of athletesData) {
        const athlete = await prisma.athlete.create({
          data: {
            ...data,
            organizationId: organization.id,
            teamId: team?.id,
            status: 'ACTIVE',
            email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
            phone: '+39 333 1234567'
          }
        });
        athletes.push(athlete);
      }
      console.log('✅ Atleti demo creati');
    }

    // Trova i tipi di pagamento
    const paymentTypes = await prisma.paymentType.findMany();

    if (paymentTypes.length === 0) {
      console.log('❌ Nessun tipo di pagamento trovato. Esegui prima create-demo-user.ts');
      return;
    }

    // Crea pagamenti per ogni atleta
    console.log('💰 Creazione pagamenti demo...');
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (const athlete of athletes) {
      // Quota iscrizione (pagata)
      const iscrizione = await prisma.payment.findFirst({
        where: {
          athleteId: athlete.id,
          typeId: paymentTypes.find(t => t.name === 'Quota Iscrizione')?.id
        }
      });

      if (!iscrizione) {
        await prisma.payment.create({
          data: {
            organizationId: organization.id,
            athleteId: athlete.id,
            typeId: paymentTypes.find(t => t.name === 'Quota Iscrizione')?.id || 1,
            amount: 150,
            paidAmount: 150,
            dueDate: new Date(currentYear, 8, 15), // 15 settembre
            paidDate: new Date(currentYear, 8, 10),
            status: 'PAID',
            description: 'Quota iscrizione stagione 2024/2025',
            createdById: demoUser.id,
            paymentMethod: 'BANK_TRANSFER'
          }
        });
      }

      // Quote mensili
      const quotaMensileType = paymentTypes.find(t => t.name === 'Quota Mensile');
      if (quotaMensileType) {
        // Mesi precedenti (pagati)
        for (let month = 9; month <= currentMonth - 1; month++) {
          const existing = await prisma.payment.findFirst({
            where: {
              athleteId: athlete.id,
              typeId: quotaMensileType.id,
              dueDate: {
                gte: new Date(currentYear, month, 1),
                lte: new Date(currentYear, month, 31)
              }
            }
          });

          if (!existing) {
            await prisma.payment.create({
              data: {
                organizationId: organization.id,
                athleteId: athlete.id,
                typeId: quotaMensileType.id,
                amount: 50,
                paidAmount: 50,
                dueDate: new Date(currentYear, month, 10),
                paidDate: new Date(currentYear, month, 5),
                createdById: demoUser.id,
                status: 'PAID',
                description: `Quota mensile ${month + 1}/${currentYear}`,
                paymentMethod: 'CASH'
              }
            });
          }
        }

        // Mese corrente (alcuni pagati, alcuni pendenti)
        const currentMonthPayment = await prisma.payment.findFirst({
          where: {
            athleteId: athlete.id,
            typeId: quotaMensileType.id,
            dueDate: {
              gte: new Date(currentYear, currentMonth, 1),
              lte: new Date(currentYear, currentMonth, 31)
            }
          }
        });

        if (!currentMonthPayment) {
          const isPaid = Math.random() > 0.3; // 70% pagati
          await prisma.payment.create({
            data: {
              organizationId: organization.id,
              athleteId: athlete.id,
              typeId: quotaMensileType.id,
              amount: 50,
              paidAmount: isPaid ? 50 : null,
              dueDate: new Date(currentYear, currentMonth, 10),
              paidDate: isPaid ? new Date() : null,
              status: isPaid ? 'PAID' : 'PENDING',
              description: `Quota mensile ${currentMonth + 1}/${currentYear}`,
              createdById: demoUser.id,
              paymentMethod: isPaid ? 'CASH' : null
            }
          });
        }

        // Prossimo mese (pendente)
        const nextMonth = (currentMonth + 1) % 12;
        const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
        
        const nextMonthPayment = await prisma.payment.findFirst({
          where: {
            athleteId: athlete.id,
            typeId: quotaMensileType.id,
            dueDate: {
              gte: new Date(nextYear, nextMonth, 1),
              lte: new Date(nextYear, nextMonth, 31)
            }
          }
        });

        if (!nextMonthPayment) {
          await prisma.payment.create({
            data: {
              organizationId: organization.id,
              athleteId: athlete.id,
              typeId: quotaMensileType.id,
              amount: 50,
              dueDate: new Date(nextYear, nextMonth, 10),
              status: 'PENDING',
              description: `Quota mensile ${nextMonth + 1}/${nextYear}`,
              createdById: demoUser.id
            }
          });
        }
      }

      // Alcuni pagamenti scaduti per test
      if (Math.random() > 0.7) { // 30% hanno pagamenti scaduti
        const overduePayment = await prisma.payment.findFirst({
          where: {
            athleteId: athlete.id,
            status: 'OVERDUE'
          }
        });

        if (!overduePayment) {
          await prisma.payment.create({
            data: {
              organizationId: organization.id,
              athleteId: athlete.id,
              typeId: paymentTypes.find(t => t.name === 'Kit Divisa')?.id || 3,
              amount: 80,
              dueDate: new Date(currentYear, currentMonth - 2, 15), // 2 mesi fa
              status: 'OVERDUE',
              description: 'Kit divisa da gioco - SCADUTO',
              createdById: demoUser.id
            }
          });
        }
      }
    }

    // Conta i pagamenti creati
    const totalPayments = await prisma.payment.count({
      where: { organizationId: organization.id }
    });

    console.log(`✅ Pagamenti demo creati! Totale: ${totalPayments}`);

    // Mostra statistiche
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      where: { organizationId: organization.id },
      _count: true,
      _sum: {
        amount: true
      }
    });

    console.log('\n📊 Statistiche pagamenti:');
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count} pagamenti - €${stat._sum.amount || 0}`);
    });

  } catch (error) {
    console.error('❌ Errore durante la creazione pagamenti demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createDemoPayments();
