import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook/mercadopago')
  @ApiOperation({ summary: 'Receber notificações de pagamento do Mercado Pago' })
  handleWebhook(@Body() body: any, @Query('tenantId') tenantId: string) {
    return this.paymentsService.handleWebhook(body, tenantId);
  }

  @Post('preference')
  @ApiOperation({ summary: 'Criar preferência de pagamento (Checkout Pro)' })
  createPreference(@Body() createPreferenceDto: CreatePreferenceDto) {
    return this.paymentsService.createPreference(createPreferenceDto);
  }

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.paymentsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
