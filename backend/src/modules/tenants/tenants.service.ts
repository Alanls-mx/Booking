import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    // Auto-seed initial data
    await this.seedInitialData(tenant.id);

    return tenant;
  }

  private async seedInitialData(tenantId: string) {
    // 1. Criar Admin User
    const adminEmail = 'admin@demo.com';
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    await this.prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        tenantId: tenantId,
      },
    });

    // 2. Criar Serviços Exemplo
    const services = [
       { name: 'Corte Clássico', duration: 30, price: 45.00, description: 'Corte tradicional com tesoura e máquina.' },
       { name: 'Barba Completa', duration: 20, price: 35.00, description: 'Barba modelada com toalha quente.' },
       { name: 'Corte + Barba', duration: 50, price: 70.00, description: 'Combo completo para o visual perfeito.' },
    ];
    
    for (const s of services) {
      await this.prisma.service.create({
        data: { ...s, tenantId },
      });
    }

    // 3. Criar Profissionais Exemplo
    const professionals = [
      { name: 'Carlos Silva', bio: 'Especialista em cortes clássicos.', email: 'carlos@demo.com' },
      { name: 'Ana Oliveira', bio: 'Expert em barbas e visagismo.', email: 'ana@demo.com' },
    ];

    for (const p of professionals) {
      await this.prisma.professional.create({
        data: { ...p, tenantId },
      });
    }
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  async update(id: string, updateData: any) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }
}
