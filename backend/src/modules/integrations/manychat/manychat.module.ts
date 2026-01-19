import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ManyChatService } from './manychat.service';
import { ManyChatController } from './manychat.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AppointmentsModule } from '../../appointments/appointments.module';
import { ServicesModule } from '../../services/services.module';
import { ProfessionalsModule } from '../../professionals/professionals.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    forwardRef(() => AppointmentsModule),
    ServicesModule,
    ProfessionalsModule,
    UsersModule,
  ],
  controllers: [ManyChatController],
  providers: [ManyChatService],
  exports: [ManyChatService],
})
export class ManyChatModule {}
