import { IsString, IsNotEmpty, IsOptional, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Carlos Barbeiro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Especialista em cortes degradê', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'carlos@barbearia.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  // Fields for User creation (optional)
  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'ADMIN', required: false, enum: ['ADMIN', 'STAFF'] })
  @IsOptional()
  @IsString()
  role?: 'ADMIN' | 'STAFF';

  @ApiProperty({ example: ['dashboard', 'team'], required: false })
  @IsOptional()
  permissions?: string[];
}
