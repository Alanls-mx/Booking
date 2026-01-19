import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo agendamento' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos de um tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('tenantId') tenantId: string, 
    @Query('date') date?: string, 
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    return this.appointmentsService.findAll(tenantId, date, page, limit, req?.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiQuery({ name: 'tenantId', required: true })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.appointmentsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento (remarcar)' })
  @ApiQuery({ name: 'tenantId', required: true })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req: any,
  ) {
    return this.appointmentsService.update(id, tenantId, updateAppointmentDto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiQuery({ name: 'tenantId', required: true })
  updateStatus(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body('status') status: AppointmentStatus,
    @Request() req: any,
  ) {
    return this.appointmentsService.updateStatus(id, tenantId, status, req.user);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Excluir múltiplos agendamentos' })
  @ApiQuery({ name: 'tenantId', required: true })
  bulkDelete(
    @Query('tenantId') tenantId: string,
    @Body('ids') ids: string[],
    @Request() req: any,
  ) {
    return this.appointmentsService.deleteMany(ids, tenantId, req.user);
  }
}
