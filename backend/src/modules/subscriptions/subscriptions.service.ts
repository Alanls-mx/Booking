import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, addMonths, addYears, startOfMonth } from 'date-fns';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const { userId, planId, tenantId, durationDays, interval, alreadyPaid, startNextMonth } =
      createSubscriptionDto;

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    let startDate = new Date();
    if (startNextMonth) {
      startDate = startOfMonth(addMonths(startDate, 1));
    }

    let endDate = new Date(startDate);
    const effectiveInterval = interval || plan.interval;

    if (durationDays && durationDays > 0) {
      endDate = addDays(startDate, durationDays);
    } else if (effectiveInterval === 'MONTHLY') {
      endDate = addMonths(startDate, 1);
    } else if (effectiveInterval === 'YEARLY') {
      endDate = addYears(startDate, 1);
    }

    await this.prisma.subscription.updateMany({
      where: { userId, tenantId, status: 'ACTIVE' },
      data: { status: 'CANCELED' },
    });

    const status = alreadyPaid ? 'ACTIVE' : 'PENDING';
    const creditsRemaining = alreadyPaid ? plan.credits : 0;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        tenantId,
        startDate,
        endDate,
        creditsRemaining,
        status,
      },
      include: { user: true, plan: true },
    });

    try {
      const user = subscription.user;
      if (user?.email) {
        await this.emailService.sendTemplateEmail(tenantId, user.email, 'subscriptionCreated', {
          userName: user.name,
          planName: subscription.plan.name,
          credits: String(subscription.creditsRemaining),
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate.toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to send subscription created email', e);
    }

    return subscription;
  }

  findAll(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    
    return this.prisma.subscription.findMany({
      where,
      include: { plan: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const before = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
      include: { user: true, plan: true },
    });

    try {
      const user = updated.user;
      if (user?.email) {
        const status = updateSubscriptionDto.status || before?.status || updated.status;
        await this.emailService.sendTemplateEmail(
          updated.tenantId,
          user.email,
          'subscriptionStatusChanged',
          {
            userName: user.name,
            planName: updated.plan.name,
            status,
            endDate: updated.endDate.toISOString(),
            credits: String(updated.creditsRemaining),
          },
        );
      }
    } catch (e) {
      console.error('Failed to send subscription status email', e);
    }

    return updated;
  }

  remove(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
