import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpar banco (ordem importa por causa das FKs)
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('Banco limpo');

  const tenantSlug = 'demo-barbershop';
  
  // 1. Criar Tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Barbershop',
        slug: tenantSlug,
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        config: { businessType: 'BARBERSHOP', hasProfessionals: true },
      },
    });
    console.log('Tenant criado:', tenant.id);
  } else {
    console.log('Tenant já existe:', tenant.id);
  }

  // 2. Criar Admin User
  const adminEmail = 'admin@demo.com';
  const existingUser = await prisma.user.findUnique({
    where: {
      email_tenantId: {
        email: adminEmail,
        tenantId: tenant.id,
      },
    },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        tenantId: tenant.id,
      },
    });
    console.log('Admin user criado:', user.id);
  } else {
    console.log('Admin user já existe');
  }

  // 3. Criar Serviços
  const servicesData = [
    { name: 'Corte Clássico', duration: 30, price: 45.00, description: 'Corte tradicional com tesoura e máquina.' },
    { name: 'Barba Completa', duration: 20, price: 35.00, description: 'Barba modelada com toalha quente.' },
    { name: 'Corte + Barba', duration: 50, price: 70.00, description: 'Combo completo para o visual perfeito.' },
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        ...s,
        tenantId: tenant.id,
      },
    });
  }
  console.log('Serviços criados');

  // 4. Criar Profissionais
  const professionalsData = [
    { name: 'Carlos Silva', bio: 'Especialista em cortes clássicos.', email: 'carlos@demo.com' },
    { name: 'Ana Oliveira', bio: 'Expert em barbas e visagismo.', email: 'ana@demo.com' },
  ];

  for (const p of professionalsData) {
    const prof = await prisma.professional.create({
      data: {
        ...p,
        tenantId: tenant.id,
      },
    });
    
    // Criar Usuário para o Profissional (para login)
    if (p.email) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                name: p.name,
                email: p.email,
                password: hashedPassword,
                role: Role.STAFF,
                tenantId: tenant.id
            }
        });
    }
    
    // Horários de trabalho (Seg-Sex, 09:00-18:00)
    for (let day = 1; day <= 5; day++) {
        await prisma.workingHours.create({
            data: {
                dayOfWeek: day,
                startTime: '09:00',
                endTime: '18:00',
                tenantId: tenant.id,
                professionalId: prof.id
            }
        });
    }
  }
  console.log('Profissionais criados');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
