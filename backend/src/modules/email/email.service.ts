import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface TenantSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName?: string;
}

export type EmailTemplateType =
  | 'appointmentConfirmation'
  | 'passwordReset'
  | 'appointmentCancellation'
  | 'paymentConfirmation'
  | 'subscriptionCreated'
  | 'subscriptionStatusChanged'
  | 'newAppointmentAdmin'
  | 'appointmentCancelledAdmin'
  | 'welcome'
  | 'paymentFailed'
  | 'appointmentReminder';

const DEFAULT_TEMPLATES: Record<EmailTemplateType, { subject: string; body: string }> = {
  welcome: {
    subject: 'Bem-vindo ao {{businessName}}!',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Bem-vindo, {{name}}!</h2>
        <p>Sua conta foi criada com sucesso no <strong>{{businessName}}</strong>.</p>
        <p>Estamos muito felizes em ter você conosco.</p>
        <p>Acesse sua conta para realizar agendamentos e gerenciar seus serviços.</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  paymentFailed: {
    subject: 'Falha no Pagamento - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #EF4444;">Olá, {{name}}!</h2>
        <p>Infelizmente não conseguimos processar o seu pagamento.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Valor:</strong> {{amount}}</p>
          <p style="margin: 5px 0;"><strong>Motivo:</strong> {{reason}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}}</p>
        </div>
        <p>Por favor, verifique seus dados de pagamento e tente novamente.</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  appointmentReminder: {
    subject: 'Lembrete de Agendamento - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Olá, {{userName}}!</h2>
        <p>Lembrete do seu agendamento para amanhã.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
          <p style="margin: 5px 0;"><strong>Profissional:</strong> {{professionalName}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}} às {{time}}</p>
        </div>
        <p>Estamos te esperando!</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  appointmentConfirmation: {
    subject: 'Confirmação de Agendamento - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Olá, {{userName}}!</h2>
        <p>Seu agendamento foi confirmado com sucesso.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
          <p style="margin: 5px 0;"><strong>Profissional:</strong> {{professionalName}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}} às {{time}}</p>
        </div>
        <p>Se precisar reagendar, entre em contato conosco.</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  appointmentCancellation: {
    subject: 'Cancelamento de Agendamento - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #EF4444;">Olá, {{userName}}!</h2>
        <p>Seu agendamento foi cancelado.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}} às {{time}}</p>
        </div>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  subscriptionCreated: {
    subject: 'Nova Assinatura Ativada - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Olá, {{userName}}!</h2>
        <p>Uma nova assinatura foi ativada para você.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Plano:</strong> {{planName}}</p>
          <p style="margin: 5px 0;"><strong>Créditos:</strong> {{credits}}</p>
          <p style="margin: 5px 0;"><strong>Período:</strong> {{startDate}} até {{endDate}}</p>
        </div>
        <p>Use seus créditos para agendar seus próximos horários com rapidez.</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `,
  },
  subscriptionStatusChanged: {
    subject: 'Atualização na sua Assinatura - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Olá, {{userName}}!</h2>
        <p>Houve uma atualização na sua assinatura.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Plano:</strong> {{planName}}</p>
          <p style="margin: 5px 0;"><strong>Novo status:</strong> {{status}}</p>
          <p style="margin: 5px 0;"><strong>Válida até:</strong> {{endDate}}</p>
          <p style="margin: 5px 0;"><strong>Créditos restantes:</strong> {{credits}}</p>
        </div>
        <p>Se tiver qualquer dúvida, entre em contato conosco.</p>
        <br/>
        <p>Atenciosamente,</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `,
  },
  passwordReset: {
    subject: 'Recuperação de Senha - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Recuperação de Senha</h2>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="margin: 30px 0;">
          <a href="{{resetLink}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 14px; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;">{{resetLink}}</p>
        <br/>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `
  },
  paymentConfirmation: {
    subject: 'Confirmação de Pagamento - {{businessName}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Olá, {{name}}!</h2>
        <p>Recebemos o seu pagamento.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Valor:</strong> {{amount}}</p>
          <p style="margin: 5px 0;"><strong>Código do pagamento:</strong> {{id}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}}</p>
        </div>
        <br/>
        <p>Obrigado pela preferência.</p>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  newAppointmentAdmin: {
    subject: 'Novo Agendamento: {{serviceName}} - {{date}} {{time}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Novo Agendamento Recebido!</h2>
        <p>Um novo agendamento foi realizado.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Cliente:</strong> {{userName}} ({{userEmail}})</p>
          <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
          <p style="margin: 5px 0;"><strong>Profissional:</strong> {{professionalName}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}} às {{time}}</p>
        </div>
        <p>Acesse o painel administrativo para ver mais detalhes.</p>
        <br/>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  },
  appointmentCancelledAdmin: {
    subject: 'Agendamento Cancelado: {{serviceName}} - {{date}} {{time}}',
    body: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #EF4444;">Agendamento Cancelado</h2>
        <p>O seguinte agendamento foi cancelado:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Cliente:</strong> {{userName}}</p>
          <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> {{date}} às {{time}}</p>
        </div>
        <br/>
        <p><strong>{{businessName}}</strong></p>
      </div>
    `
  }
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async getTenantSmtpConfig(tenantId: string): Promise<TenantSmtpConfig | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true },
    });

    const config = (tenant?.config || {}) as any;
    const smtp = config.smtp as TenantSmtpConfig | undefined;

    if (smtp && smtp.host && smtp.port && smtp.user && smtp.password && smtp.fromEmail) {
      return smtp;
    }

    const envHost = this.configService.get<string>('SMTP_HOST');
    const envPort = this.configService.get<string>('SMTP_PORT');
    const envUser = this.configService.get<string>('SMTP_USER');
    const envPass = this.configService.get<string>('SMTP_PASS');
    const envFrom = this.configService.get<string>('SMTP_FROM');

    if (envHost && envPort && envUser && envPass && envFrom) {
      return {
        host: envHost,
        port: Number(envPort) || 587,
        secure: false,
        user: envUser,
        password: envPass,
        fromEmail: envFrom,
      };
    }

    return null;
  }

  private async createTransport(tenantId: string) {
    const smtpConfig = await this.getTenantSmtpConfig(tenantId);
    if (!smtpConfig) {
      this.logger.warn(`SMTP config not found for tenant ${tenantId}`);
      return null;
    }

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });
  }

  async sendMail(
    tenantId: string,
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const smtpConfig = await this.getTenantSmtpConfig(tenantId);

    if (!smtpConfig) {
      this.logger.warn(`Skipping email send, SMTP not configured for tenant ${tenantId}`);
      return;
    }

    const transport = await this.createTransport(tenantId);
    if (!transport) {
      return;
    }

    const from = smtpConfig.fromName
      ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail;

    try {
      await transport.sendMail({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Error sending email for tenant ${tenantId}: ${error}`);
    }
  }

  async sendTestEmail(config: TenantSmtpConfig, to: string): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });

      // Verify connection configuration
      await transporter.verify();

      const from = config.fromName
        ? `${config.fromName} <${config.fromEmail}>`
        : config.fromEmail;

      await transporter.sendMail({
        from,
        to,
        subject: 'Teste de Configuração SMTP - FlexBook',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4F46E5;">Teste de Conexão Bem-sucedido!</h2>
            <p>Olá,</p>
            <p>Se você está recebendo este e-mail, significa que as configurações SMTP do seu sistema FlexBook estão corretas.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Configuração utilizada:</p>
            <ul style="color: #666; font-size: 12px;">
              <li>Host: ${config.host}</li>
              <li>Port: ${config.port}</li>
              <li>User: ${config.user}</li>
              <li>Secure: ${config.secure ? 'Sim' : 'Não'}</li>
            </ul>
          </div>
        `,
      });

      return true;
    } catch (error: any) {
      this.logger.error(`SMTP Test Failed: ${error.message}`);
      throw new Error(`Falha na conexão SMTP: ${error.message}`);
    }
  }

  async sendTemplateEmail(
    tenantId: string,
    to: string,
    type: EmailTemplateType,
    variables: Record<string, string>
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true, name: true },
    });

    const config = (tenant?.config || {}) as any;
    const customTemplates = config.emailTemplates || {};
    
    let template = customTemplates[type] || DEFAULT_TEMPLATES[type];
    
    // Fallback if custom template is incomplete
    if (!template.subject || !template.body) {
        template = DEFAULT_TEMPLATES[type];
    }

    let subject = template.subject;
    let body = template.body;

    // Add common variables
    const allVariables = {
        ...variables,
        businessName: tenant?.name || 'FlexBook',
    };

    // Replace variables
    Object.keys(allVariables).forEach(key => {
      // Use a more robust replacement that handles multiple occurrences
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, allVariables[key]);
      body = body.replace(regex, allVariables[key]);
    });

    await this.sendMail(tenantId, to, subject, body);
  }

  async getTemplates(tenantId: string): Promise<Record<EmailTemplateType, { subject: string; body: string }>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true },
    });

    const config = (tenant?.config || {}) as any;
    const customTemplates = config.emailTemplates || {};

    const types = Object.keys(DEFAULT_TEMPLATES) as EmailTemplateType[];
    const result: Record<EmailTemplateType, { subject: string; body: string }> = {} as any;

    for (const type of types) {
      const custom = customTemplates[type];
      const template = custom && custom.subject && custom.body ? custom : DEFAULT_TEMPLATES[type];
      result[type] = {
        subject: template.subject,
        body: template.body,
      };
    }

    return result;
  }
}
