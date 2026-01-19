import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de Cabelo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Corte tradicional com tesoura e máquina', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30, description: 'Duração em minutos' })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: ['uuid-plan-1', 'uuid-plan-2'], required: false })
  @IsOptional()
  @IsString({ each: true })
  planIds?: string[];
}
