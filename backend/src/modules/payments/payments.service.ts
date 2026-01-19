import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ManyChatService } from '../integrations/manychat/manychat.service';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private manyChatService: ManyChatService,
  ) {}

  async handleWebhook(body: any, tenantId: string) {
    const { type, data } = body;
    
    if (body.action === 'test.created') return { status: 'ok' };

    const paymentId = data?.id || body?.data?.id;
    const topic = type || body?.type;

    if (topic === 'payment' && paymentId) {
       const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
       if (!tenant) return { error: 'Tenant not found' };
       
       const config = tenant.config as any;
       const accessToken = config?.payment?.mpAccessToken;
       
       if (!accessToken) return { error: 'Access Token missing' };

       const client = new MercadoPagoConfig({ accessToken });
       const paymentClient = new Payment(client);

       try {
         const paymentData = await paymentClient.get({ id: paymentId });
         
         if (paymentData.status === 'approved') {
           const externalReference = paymentData.external_reference;

           if (externalReference) {
             await this.prisma.appointment.update({
               where: { id: externalReference },
               data: { status: 'CONFIRMED' },
             });

             const existingPayment = await this.prisma.payment.findFirst({
               where: {
                 appointmentId: externalReference,
                 status: 'COMPLETED',
               },
             });

             if (!existingPayment) {
               const appointment = await this.prisma.appointment.findUnique({
                 where: { id: externalReference },
                 include: { user: true, professional: true, services: true },
               });

               if (appointment) {
                 const newPayment = await this.prisma.payment.create({
                   data: {
                     amount: Number(paymentData.transaction_amount),
                     method: 'ONLINE',
                     status: 'COMPLETED',
                     type: 'APPOINTMENT',
                     userId: appointment.userId,
                     tenantId: tenantId,
                     appointmentId: externalReference,
                     createdAt: new Date(paymentData.date_approved || new Date()),
                   },
                   include: { user: true },
                 });

                 this.sendNotifications(newPayment);

                 try {
                   const dateStr = new Date(appointment.date).toLocaleString('pt-BR', {
                     timeZone: 'America/Sao_Paulo',
                   });
                   const time = dateStr.split(' ')[1] || dateStr;
                   const dateOnly = dateStr.split(' ')[0] || dateStr;

                   await this.manyChatService.notifyUser(
                     tenantId,
                     appointment.userId,
                     `🗓️ Novo agendamento confirmado para ${dateStr}!`,
                   );

                   if (appointment.user?.email) {
                     await this.emailService.sendTemplateEmail(
                       tenantId,
                       appointment.user.email,
                       'appointmentConfirmation',
                       {
                         userName: appointment.user.name,
                         serviceName: appointment.services.map(s => s.name).join(', '),
                         professionalName: appointment.professional?.name || 'Não especificado',
                         date: dateOnly,
                         time: time,
                       },
                     );
                   }

                   if (appointment.professional?.email) {
                     await this.emailService.sendTemplateEmail(
                       tenantId,
                       appointment.professional.email,
                       'newAppointmentAdmin',
                       {
                         userName: appointment.user.name,
                         userEmail: appointment.user.email,
                         serviceName: appointment.services.map(s => s.name).join(', '),
                         professionalName: appointment.professional.name,
                         date: dateOnly,
                         time: time,
                       },
                     );
                   }
                 } catch (notificationError) {
                   console.error('Failed to send appointment confirmation notifications', notificationError);
                 }
               }
             }
           }
         }
       } catch (error) {
           console.error('Error processing webhook:', error);
       }
    }

    return { status: 'received' };
  }

  async createPreference(createPreferenceDto: CreatePreferenceDto) {
    const { appointmentId, tenantId, gateway } = createPreferenceDto;

    if (gateway !== 'MERCADO_PAGO') {
      throw new BadRequestException('Only Mercado Pago is supported for preferences currently.');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { services: true, user: true }
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const config = tenant?.config as any;
    const accessToken = config?.payment?.mpAccessToken;

    if (!accessToken) {
      throw new BadRequestException('Mercado Pago Access Token not configured for this tenant.');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const items = appointment.services.map((s) => ({
      id: s.id,
      title: s.name,
      unit_price: Number(s.price),
      quantity: 1,
    }));

    const apiUrl = process.env.API_URL || 'http://localhost:3000'; // Em produção, definir API_URL

    try {
      const result = await preference.create({
        body: {
          items,
          payer: {
            name: appointment.user.name,
            email: appointment.user.email,
          },
          external_reference: appointment.id,
          notification_url: `${apiUrl}/payments/webhook/mercadopago?tenantId=${tenantId}`,
          back_urls: {
            success: `http://localhost:5173/booking/success?appointmentId=${appointment.id}&status=success`,
            failure: `http://localhost:5173/booking/success?appointmentId=${appointment.id}&status=failure`,
            pending: `http://localhost:5173/booking/success?appointmentId=${appointment.id}&status=pending`
          }
        }
      });

      return { init_point: result.init_point };
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);

      const mpMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create Mercado Pago preference';

      throw new BadRequestException(mpMessage);
    }
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const { amount, method, userId, tenantId, appointmentId, subscriptionId } = createPaymentDto;

    // Logic for Plan Credit
    if (method === 'PLAN_CREDIT') {
      // Find active subscription
      const sub = await this.prisma.subscription.findFirst({
        where: { userId, tenantId, status: 'ACTIVE', creditsRemaining: { gt: 0 } },
      });

      if (!sub) {
        throw new BadRequestException('No active subscription with credits found.');
      }

      // Deduct credit
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { creditsRemaining: sub.creditsRemaining - 1 },
      });

      // Update DTO to link to subscription
      createPaymentDto.subscriptionId = sub.id;
    }

    // Create Payment Record
    const payment = await this.prisma.payment.create({
      data: {
        amount,
        method,
        status: 'COMPLETED', // Assuming instant success for now
        type: appointmentId ? 'APPOINTMENT' : 'SUBSCRIPTION',
        userId,
        tenantId,
        appointmentId,
        subscriptionId: createPaymentDto.subscriptionId || subscriptionId,
      },
      include: { user: true },
    });

    // Post-payment actions
    if (payment.status === 'COMPLETED') {
      // If it's a subscription payment (buying a plan), activate the subscription
      if (subscriptionId && method !== 'PLAN_CREDIT') {
        const updatedSub = await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE' },
          include: { plan: true },
        });

        if (payment.user?.email) {
          try {
            await this.emailService.sendTemplateEmail(
              payment.tenantId,
              payment.user.email,
              'subscriptionCreated',
              {
                userName: payment.user.name,
                planName: updatedSub.plan.name,
                credits: String(updatedSub.creditsRemaining),
                startDate: updatedSub.startDate.toLocaleDateString('pt-BR'),
                endDate: updatedSub.endDate.toLocaleDateString('pt-BR'),
              },
            );
          } catch (error) {
            console.error('Failed to send subscription email', error);
          }
        }
      }

      // Send Notifications
      this.sendNotifications(payment);
    }

    return payment;
  }

  async sendNotifications(payment: any) {
    try {
      const user = payment.user;
      const amountNumber = Number(payment.amount);
      const formattedAmount = isNaN(amountNumber)
        ? String(payment.amount)
        : amountNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      if (user?.email) {
        await this.emailService.sendTemplateEmail(
          payment.tenantId,
          user.email,
          'paymentConfirmation',
          {
            name: user.name,
            amount: formattedAmount,
            id: payment.id,
            date: payment.createdAt.toISOString(),
          },
        );
      }

      if (payment.userId) {
        const message = `💳 Pagamento confirmado no valor de ${formattedAmount}.`;
        await this.manyChatService.notifyUser(payment.tenantId, payment.userId, message);
      }
    } catch (error) {
      console.error('Failed to send notifications', error);
    }
  }

  findAll(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
      include: { user: true },
    });

    if (payment.status === 'FAILED' && payment.user?.email) {
       try {
        const amountNumber = Number(payment.amount);
        const formattedAmount = isNaN(amountNumber)
          ? String(payment.amount)
          : amountNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        await this.emailService.sendTemplateEmail(
          payment.tenantId,
          payment.user.email,
          'paymentFailed',
          {
            name: payment.user.name,
            amount: formattedAmount,
            reason: 'Processamento falhou',
            date: payment.createdAt.toLocaleDateString('pt-BR'),
          }
        );
      } catch (error) {
        console.error('Failed to send payment failed email', error);
      }
    }

    return payment;
  }

  remove(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}
