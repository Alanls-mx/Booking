import { Controller, Post, Body, Headers, BadRequestException, Logger, Get, UseGuards } from '@nestjs/common';
import { ManyChatService } from './manychat.service';
import { AppointmentsService } from '../../appointments/appointments.service';
import { ServicesService } from '../../services/services.service';
import { ProfessionalsService } from '../../professionals/professionals.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('integrations/manychat')
export class ManyChatController {
  private readonly logger = new Logger(ManyChatController.name);

  constructor(
    private readonly manyChatService: ManyChatService,
    private readonly appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
    private readonly professionalsService: ProfessionalsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('test-connection')
  @UseGuards(JwtAuthGuard)
  async testConnection(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (in header)');
    }

    return this.manyChatService.testConnection(tenantId);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('x-tenant-id') tenantIdHeader: string) {
    this.logger.log(`Received webhook: ${JSON.stringify(body)}`);
    
    // Support tenantId in header or body
    const tenantId = tenantIdHeader || body.tenantId;

    if (!tenantId) {
        throw new BadRequestException('Tenant ID is required (in header or body)');
    }

    const { action } = body;

    switch (action) {
      case 'check_availability':
        return this.checkAvailability(tenantId, body);
      case 'create_appointment':
        return this.createAppointment(tenantId, body);
      case 'get_services':
        return this.getServices(tenantId);
      case 'get_professionals':
        return this.getProfessionals(tenantId);
      case 'get_user_appointments':
        return this.getUserAppointments(tenantId, body);
      default:
        return { status: 'ignored', message: `Unknown action: ${action}` };
    }
  }

  private async checkAvailability(tenantId: string, body: any) {
    const { date, serviceId, professionalId } = body;
    if (!date) {
        return { status: 'error', message: 'Date is required' };
    }

    const slots = await this.appointmentsService.getAvailableSlots(tenantId, date, serviceId, professionalId);
    
    return {
        status: 'success',
        date,
        slots
    };
  }

  private async createAppointment(tenantId: string, body: any) {
    const { 
      email, 
      name, 
      phone, 
      date, // ISO string or YYYY-MM-DD HH:mm
      serviceId, 
      professionalId,
      subscriber_id 
    } = body;

    if (!email || !date || !serviceId) {
        throw new BadRequestException('Missing required fields: email, date, serviceId');
    }

    // 1. Find or Create User
    let user = await this.prisma.user.findUnique({
        where: { email_tenantId: { email, tenantId } }
    });

    if (!user) {
        user = await this.prisma.user.create({
            data: {
                email,
                name: name || 'ManyChat User',
                password: Math.random().toString(36).slice(-8), // Random password
                tenantId,
                role: 'CLIENT',
                phone,
                manyChatSubscriberId: subscriber_id
            }
        });
    } else if (subscriber_id && user.manyChatSubscriberId !== subscriber_id) {
        // Update subscriber ID if provided and different
        await this.prisma.user.update({
            where: { id: user.id },
            data: { manyChatSubscriberId: subscriber_id }
        });
    }

    // 2. Create Appointment
    // Ensure date is proper ISO
    const appointmentDate = new Date(date);
    
    const appointment = await this.appointmentsService.create({
        date: appointmentDate.toISOString(),
        serviceIds: [serviceId],
        professionalId,
        tenantId,
        userId: user.id,
        status: 'CONFIRMED' 
    });

    return { 
        status: 'success', 
        appointmentId: appointment.id,
        message: 'Agendamento realizado com sucesso!'
    };
  }

  private async getServices(tenantId: string) {
      const services = await this.servicesService.findAll(tenantId);
      return { 
          status: 'success', 
          services: services.map(s => ({ 
              id: s.id, 
              name: s.name, 
              price: Number(s.price),
              duration: s.duration 
          })) 
      };
  }

  private async getProfessionals(tenantId: string) {
      const pros = await this.professionalsService.findAll(tenantId);
      return { 
          status: 'success', 
          professionals: pros.map(p => ({ id: p.id, name: p.name })) 
      };
  }

  private async getUserAppointments(tenantId: string, body: any) {
      const { email } = body;
      if (!email) return { status: 'error', message: 'Email required' };

      const user = await this.prisma.user.findUnique({
          where: { email_tenantId: { email, tenantId } }
      });

      if (!user) return { status: 'success', appointments: [] };

      // Re-using findAll with client role filter logic would be complex due to how it expects 'user' object from Request
      // So we use prisma directly here for simplicity
      const appointments = await this.prisma.appointment.findMany({
          where: { tenantId, userId: user.id },
          include: { services: true, professional: true },
          orderBy: { date: 'desc' },
          take: 5
      });

      return {
          status: 'success',
          appointments: appointments.map(a => ({
              id: a.id,
              date: a.date,
              status: a.status,
              serviceName: a.services[0]?.name || 'Serviço',
              professionalName: a.professional?.name || 'Profissional'
          }))
      };
  }
}
