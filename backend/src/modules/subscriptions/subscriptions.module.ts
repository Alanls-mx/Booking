import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PrismaService, EmailService],
})
export class SubscriptionsModule {}
