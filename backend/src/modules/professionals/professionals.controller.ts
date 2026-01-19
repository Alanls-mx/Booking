import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch, Delete } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo profissional' })
  create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return this.professionalsService.create(createProfessionalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar profissionais de um tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.professionalsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiQuery({ name: 'tenantId', required: true })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.professionalsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiQuery({ name: 'tenantId', required: true })
  update(@Param('id') id: string, @Query('tenantId') tenantId: string, @Body() updateProfessionalDto: UpdateProfessionalDto) {
    return this.professionalsService.update(id, tenantId, updateProfessionalDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover profissional' })
  @ApiQuery({ name: 'tenantId', required: true })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.professionalsService.remove(id, tenantId);
  }
}
