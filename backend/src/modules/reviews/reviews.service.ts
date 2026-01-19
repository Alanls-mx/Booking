import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    const hasHistory = await this.prisma.appointment.findFirst({
      where: {
        userId: createReviewDto.userId,
        tenantId: createReviewDto.tenantId,
        status: AppointmentStatus.COMPLETED,
      }
    });

    if (!hasHistory) {
      throw new BadRequestException('Você precisa ter pelo menos um corte concluído para avaliar.');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: createReviewDto.userId,
        tenantId: createReviewDto.tenantId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Você já enviou uma avaliação para este estabelecimento.');
    }

    return this.prisma.review.create({
      data: createReviewDto
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.review.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findFeatured(tenantId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return (reviews as any[])
      .filter((review: any) => review.isFeatured)
      .slice(0, 6);
  }

  async update(id: string, tenantId: string, data: { rating?: number; comment?: string; isFeatured?: boolean }) {
    return this.prisma.review.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.review.delete({
      where: { id },
    });
  }
}
