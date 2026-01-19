import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  method: string; // 'CREDIT_CARD' | 'PIX' | 'CASH' | 'PLAN_CREDIT'

  @IsString()
  userId: string;

  @IsString()
  tenantId: string;

  @IsString()
  @IsOptional()
  appointmentId?: string;

  @IsString()
  @IsOptional()
  subscriptionId?: string;
  
  @IsString()
  @IsOptional()
  gatewayRef?: string;
}
