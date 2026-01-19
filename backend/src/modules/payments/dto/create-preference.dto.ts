import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePreferenceDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  gateway: string;
}
