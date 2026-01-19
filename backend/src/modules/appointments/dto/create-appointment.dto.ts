import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2023-12-25T14:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ required: false, example: 'Corte de cabelo simples' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: 'uuid-do-usuario-cliente' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds?: string[];

  @ApiProperty({ example: 'uuid-do-profissional', required: false })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiProperty({ example: 'uuid-da-unidade', required: false })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ example: 'AT_LOCATION', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
