import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ServicesModule } from './modules/services/services.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ManyChatModule } from './modules/integrations/manychat/manychat.module';
import { LocationsModule } from './modules/locations/locations.module';
import { EmailModule } from './modules/email/email.module';
import { SetupModule } from './modules/setup/setup.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PlansModule } from './modules/plans/plans.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    AppointmentsModule,
    ServicesModule,
    ProfessionalsModule,
    AnalyticsModule,
    ReviewsModule,
    UploadsModule,
    ManyChatModule,
    LocationsModule,
    EmailModule,
    SetupModule,
    SubscriptionsModule,
    PlansModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
