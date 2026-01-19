import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'Unidade Centro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Rua Principal, 123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
