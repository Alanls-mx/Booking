import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de lucro e agendamentos (Dia, Semana, Mês)' })
  @ApiQuery({ name: 'tenantId', required: true })
  getStats(@Query('tenantId') tenantId: string) {
    return this.analyticsService.getStats(tenantId);
  }
}
