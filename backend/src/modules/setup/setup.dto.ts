import { IsString, IsOptional, IsEmail, MinLength, IsBoolean, IsObject } from 'class-validator';

export class SetupDto {
  @IsString()
  @IsOptional()
  databaseUrl?: string;

  @IsString()
  businessName: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;

  @IsString()
  adminName: string;

  @IsObject()
  @IsOptional()
  modules?: {
    appointments?: boolean;
    crm?: boolean;
    financial?: boolean;
    website?: boolean;
    [key: string]: boolean | undefined;
  };
}
