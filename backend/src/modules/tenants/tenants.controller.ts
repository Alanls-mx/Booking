import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
const pdf = require('pdf-parse');

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo tenant (Empresa)' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tenant por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
  
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Buscar tenant por Slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Post('extract-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Extrair texto de um arquivo PDF' })
  async extractPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Por favor envie um arquivo PDF válido.');
    }
    
    try {
      const data = await pdf(file.buffer);
      return { text: data.text };
    } catch (error) {
      console.error('Erro ao ler PDF:', error);
      throw new BadRequestException('Erro ao processar o arquivo PDF.');
    }
  }

  @Post(':id') // Usando POST como UPDATE/PATCH simplificado ou PATCH real
  @ApiOperation({ summary: 'Atualizar tenant' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.tenantsService.update(id, updateData);
  }
}
