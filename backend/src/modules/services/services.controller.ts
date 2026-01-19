import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch, Delete } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo serviço' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar serviços de um tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiQuery({ name: 'tenantId', required: true })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.servicesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiQuery({ name: 'tenantId', required: true })
  update(@Param('id') id: string, @Query('tenantId') tenantId: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, tenantId, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover serviço' })
  @ApiQuery({ name: 'tenantId', required: true })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.servicesService.remove(id, tenantId);
  }
}
