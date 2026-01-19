import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { ManyChatService } from '../integrations/manychat/manychat.service';
import { EmailService } from '../email/email.service';
import { PaymentsService } from '../payments/payments.service';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: { user: true; services: true; professional: true; location: true };
}>;

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ManyChatService))
    private manyChatService: ManyChatService,
    private emailService: EmailService,
    private paymentsService: PaymentsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    const { tenantId, date, professionalId, serviceIds, paymentMethod, ...rest } = createAppointmentDto;

    // Validação simples de disponibilidade (exemplo)
    if (professionalId) {
      const existing = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          date: new Date(date),
          status: { not: AppointmentStatus.CANCELED },
        },
      });

      if (existing) {
        throw new BadRequestException('Professional is not available at this time');
      }
    }

    const appointment: AppointmentWithRelations = await this.prisma.appointment.create({
      data: {
        tenantId,
        date: new Date(date),
        professionalId,
        paymentMethod,
        ...rest,
        services: serviceIds
          ? {
              connect: serviceIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        user: true,
        services: true,
        professional: true,
        location: true,
      },
    });

    if (paymentMethod === 'PLAN_CREDIT') {
      try {
        const paymentDto: CreatePaymentDto = {
          amount: 0,
          method: 'PLAN_CREDIT',
          userId: appointment.userId,
          tenantId,
          appointmentId: appointment.id,
        };
        await this.paymentsService.create(paymentDto);
      } catch (error) {
        console.error('Failed to process plan credit payment', error);
      }
    }

    if (paymentMethod !== 'ONLINE') {
      try {
        const dateStr = new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        await this.manyChatService.notifyUser(
          tenantId,
          appointment.userId,
          `🗓️ Novo agendamento confirmado para ${dateStr}!`,
        );

        if (appointment.user?.email) {
          const time = dateStr.split(' ')[1] || dateStr;
          const dateOnly = dateStr.split(' ')[0] || dateStr;

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
          const time = dateStr.split(' ')[1] || dateStr;
          const dateOnly = dateStr.split(' ')[0] || dateStr;

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
      } catch (e) {
        console.error('Failed to notify user', e);
      }
    }

    return appointment;
  }

  async findAll(tenantId: string, date?: string, page?: number, limit?: number, user?: any) {
    const whereClause: any = { tenantId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Role-based filtering
    if (user) {
      if (user.role === 'STAFF') {
        // Find professional linked to this user's email
        const professional = await this.prisma.professional.findFirst({
          where: { email: user.email, tenantId },
        });
        if (professional) {
          whereClause.professionalId = professional.id;
        }
      } else if (user.role === 'CLIENT') {
        whereClause.userId = user.id;
      }
    }

    console.log('[AppointmentsService.findAll] Query params:', { tenantId, date, page, limit, userRole: user?.role });
    console.log('[AppointmentsService.findAll] Where clause:', JSON.stringify(whereClause));

    // If pagination is not provided, return all (backward compatibility or specific usage)
    // However, it's recommended to always paginate or default to a reasonable limit.
    // For now, if no page/limit, we just return findMany as before.
    if (!page || !limit) {
      return this.prisma.appointment.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          services: true,
          professional: true,
          location: true,
        },
        orderBy: { date: 'asc' },
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          services: true,
          professional: true,
          location: true,
        },
        orderBy: { date: 'desc' }, // Usually recent first for paginated lists
        skip,
        take,
      }),
      this.prisma.appointment.count({ where: whereClause })
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  async findOne(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        services: true,
        professional: true,
        location: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async updateStatus(id: string, tenantId: string, status: AppointmentStatus, user?: any) {
    const appointment = await this.findOne(id, tenantId);

    if (user) {
      if (user.role === 'CLIENT') {
        if (status !== AppointmentStatus.CANCELED) {
          throw new ForbiddenException('Clientes só podem cancelar agendamentos.');
        }
        if (appointment.userId !== user.id) {
          throw new ForbiddenException('Você não tem permissão para alterar este agendamento.');
        }
      } else if (user.role === 'STAFF') {
        const professional = await this.prisma.professional.findFirst({
          where: { email: user.email, tenantId }
        });
        if (!professional || professional.id !== appointment.professionalId) {
          throw new ForbiddenException('Você só pode gerenciar agendamentos atribuídos a você.');
        }
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });

    // Notify via ManyChat and Email
    try {
        let message = '';
        let subject = '';
        if (status === AppointmentStatus.CONFIRMED) {
          message = `✅ Seu agendamento foi CONFIRMADO!`;
          subject = 'Agendamento Confirmado';
        } else if (status === AppointmentStatus.CANCELED) {
          message = `❌ Seu agendamento foi CANCELADO.`;
          subject = 'Agendamento Cancelado';
        } else if (status === AppointmentStatus.COMPLETED) {
          message = `👋 Obrigado pela visita! Esperamos vê-lo novamente em breve.`;
          subject = 'Agendamento Concluído';
        }
        
        if (message) {
             // ManyChat
             await this.manyChatService.notifyUser(tenantId, updated.userId, message);

             // Email
             const user = await this.prisma.user.findUnique({ where: { id: updated.userId } });
             if (user?.email) {
               const dateStr = new Date(updated.date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
               const time = dateStr.split(' ')[1] || dateStr;
               const dateOnly = dateStr.split(' ')[0] || dateStr;
               const serviceName = appointment.services.map(s => s.name).join(', ');

               if (status === AppointmentStatus.CANCELED) {
                  await this.emailService.sendTemplateEmail(
                     tenantId, user.email, 'appointmentCancellation',
                     { userName: user.name, serviceName, date: dateOnly, time }
                  );

                  // Notify Professional
                  if (appointment.professional?.email) {
                    await this.emailService.sendTemplateEmail(
                      tenantId, appointment.professional.email, 'appointmentCancelledAdmin',
                      { userName: user.name, serviceName, date: dateOnly, time }
                    );
                  }
               } else if (status === AppointmentStatus.CONFIRMED) {
                  await this.emailService.sendTemplateEmail(
                     tenantId, user.email, 'appointmentConfirmation',
                     { 
                        userName: user.name, serviceName, date: dateOnly, time,
                        professionalName: appointment.professional?.name || 'Não especificado'
                     }
                  );
               } else {
                   const html = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                      <h2>${subject}</h2>
                      <p>Olá <strong>${user.name}</strong>,</p>
                      <p>${message}</p>
                      <p><strong>Data:</strong> ${dateStr}</p>
                      <br/>
                      <p>FlexBook</p>
                    </div>
                   `;
                   await this.emailService.sendMail(tenantId, user.email, subject, html);
               }
             }
        }
    } catch (e) {
        console.error('Failed to notify user update', e);
    }

    return updated;
  }

  async deleteMany(ids: string[], tenantId: string, user?: any) {
    if (user && user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem excluir agendamentos.');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        id: { in: ids },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const hasCompleted = appointments.some(a => a.status === AppointmentStatus.COMPLETED);

    if (hasCompleted) {
      throw new BadRequestException('Não é permitido excluir agendamentos concluídos.');
    }

    await this.prisma.payment.deleteMany({
      where: {
        tenantId,
        appointmentId: { in: ids },
      },
    });

    const result = await this.prisma.appointment.deleteMany({
      where: {
        tenantId,
        id: { in: ids },
      },
    });

    return { count: result.count };
  }

  async update(id: string, tenantId: string, updateAppointmentDto: UpdateAppointmentDto, user?: any) {
    const appointment = await this.findOne(id, tenantId);

    if (user) {
      if (user.role === 'CLIENT') {
        throw new ForbiddenException('Clientes não podem editar agendamentos diretamente.');
      } else if (user.role === 'STAFF') {
        const professional = await this.prisma.professional.findFirst({
          where: { email: user.email, tenantId }
        });
        if (!professional || professional.id !== appointment.professionalId) {
          throw new ForbiddenException('Você só pode editar agendamentos atribuídos a você.');
        }
      }
    }

    // Se estiver alterando data/profissional, verificar disponibilidade novamente
    if (updateAppointmentDto.date || updateAppointmentDto.professionalId) {
      const date = updateAppointmentDto.date ? new Date(updateAppointmentDto.date) : appointment.date;
      const professionalId = updateAppointmentDto.professionalId || appointment.professionalId;

      if (professionalId) {
        const existing = await this.prisma.appointment.findFirst({
          where: {
            tenantId,
            professionalId,
            date: date,
            status: { not: AppointmentStatus.CANCELED },
            id: { not: id }, // Excluir o próprio agendamento da verificação
          },
        });

        if (existing) {
          throw new BadRequestException('Profissional não disponível neste horário');
        }
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
    });
  }

  async getAvailableSlots(tenantId: string, dateStr: string, serviceId?: string, professionalId?: string) {
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: AppointmentStatus.CANCELED },
        ...(professionalId ? { professionalId } : {})
      },
      include: { services: true }
    });

    let serviceDuration = 60;
    if (serviceId) {
       const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
       if (service) serviceDuration = service.duration;
    }

    const startHour = 9;
    const endHour = 18;

    const availableSlots: string[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += 30) {
             const slotTime = new Date(date);
             slotTime.setHours(hour, min, 0, 0);
             const slotEndTime = new Date(slotTime.getTime() + serviceDuration * 60000);

             if (slotEndTime.getHours() > endHour || (slotEndTime.getHours() === endHour && slotEndTime.getMinutes() > 0)) continue; 

             const hasCollision = appointments.some(appt => {
                 const apptStart = new Date(appt.date);
                 const apptDuration = appt.services.reduce((acc, s) => acc + s.duration, 0) || 60;
                 const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);
                 return (slotTime < apptEnd && slotEndTime > apptStart);
             });

             if (!hasCollision) {
                 availableSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
             }
        }
    }

    return availableSlots;
  }
}
