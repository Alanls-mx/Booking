import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { EmailService, TenantSmtpConfig } from './email.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Obter templates de e-mail atuais' })
  async getTemplates(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.emailService.getTemplates(tenantId);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Testar conexão SMTP' })
  async testConnection(@Body() body: { config: TenantSmtpConfig }, @Req() req: any) {
    const userEmail = req.user.email;
    await this.emailService.sendTestEmail(body.config, userEmail);
    return { success: true, message: 'E-mail de teste enviado com sucesso!' };
  }
}
