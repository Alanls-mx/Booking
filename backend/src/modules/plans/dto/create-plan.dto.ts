import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  interval: string; // MONTHLY, YEARLY

  @IsNumber()
  credits: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsOptional()
  includedServices?: any; // Json
}
