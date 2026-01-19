import { IsString, IsNotEmpty, IsOptional, IsHexColor, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Barbearia do Zé' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'barbearia-do-ze' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: '#000000', required: false })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ example: '#ffffff', required: false })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({ required: false, example: { businessType: 'BARBERSHOP', hasProfessionals: true } })
  @IsOptional()
  config?: any;
}
