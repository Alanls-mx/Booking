import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async update(id: string, tenantId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new ConflictException('Current password is required to set a new password');
      }

      const isPasswordValid = await bcrypt.compare(updateUserDto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ConflictException('Current password is incorrect');
      }

      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Remove currentPassword from dto before saving
    delete updateUserDto.currentPassword;

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const { password: _, ...result } = updated;
    return result;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, tenantId, password, ...rest } = createUserDto;

    // Verificar se usuário já existe neste tenant
    const existing = await this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        tenantId,
        password: hashedPassword,
      },
    });

    try {
      await this.emailService.sendTemplateEmail(
        tenantId,
        user.email,
        'welcome',
        {
          name: user.name,
        }
      );
    } catch (error) {
      console.error('Failed to send welcome email', error);
    }

    // Remover password do retorno
    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId,
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(tenantId: string, role?: Role, page?: number, limit?: number) {
    const whereClause = {
      tenantId,
      ...(role ? { role } : {}),
    };

    if (!page || !limit) {
      const [users, subscriptions] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.subscription.findMany({
          where: {
            tenantId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            userId: true,
            creditsRemaining: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        }),
      ]);

      const subsByUser = subscriptions.reduce<
        Record<
          string,
          { id: string; creditsRemaining: number; status: string; startDate: Date; endDate: Date }
        >
      >(
        (acc, sub) => {
          acc[sub.userId] = sub;
          return acc;
        },
        {},
      );

      return users.map((user) => ({
        ...user,
        subscription: subsByUser[user.id] || null,
      }));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total, subscriptions] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where: whereClause }),
      this.prisma.subscription.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          userId: true,
          creditsRemaining: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      }),
    ]);

    const subsByUser = subscriptions.reduce<
      Record<
        string,
        { id: string; creditsRemaining: number; status: string; startDate: Date; endDate: Date }
      >
    >(
      (acc, sub) => {
        acc[sub.userId] = sub;
        return acc;
      },
      {},
    );

    return {
      data: data.map((user) => ({
        ...user,
        subscription: subsByUser[user.id] || null,
      })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
