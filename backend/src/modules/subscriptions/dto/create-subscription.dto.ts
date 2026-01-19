import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsString()
  tenantId: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  interval?: string;

  @IsOptional()
  @IsBoolean()
  alreadyPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  startNextMonth?: boolean;
}
