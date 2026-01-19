import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const { planIds, ...data } = createServiceDto;
    return this.prisma.service.create({
      data: {
        ...data,
        plans: planIds ? {
          connect: planIds.map(id => ({ id }))
        } : undefined
      },
      include: { plans: true }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      include: { plans: { select: { id: true, name: true } } }
    });
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
      include: { plans: { select: { id: true, name: true } } }
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, tenantId: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id, tenantId);
    const { planIds, ...data } = updateServiceDto;

    return this.prisma.service.update({
      where: { id: service.id },
      data: {
        ...data,
        plans: planIds ? {
          set: planIds.map(id => ({ id }))
        } : undefined
      },
      include: { plans: true }
    });
  }

  async remove(id: string, tenantId: string) {
    const service = await this.findOne(id, tenantId);

    return this.prisma.service.delete({
      where: { id: service.id },
    });
  }
}
