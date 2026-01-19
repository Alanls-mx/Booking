import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ManyChatService {
  private readonly logger = new Logger(ManyChatService.name);
  private readonly BASE_URL = 'https://api.manychat.com/fb';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  private async getApiKey(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true },
    });

    if (!tenant || !tenant.config) return null;
    const config = tenant.config as any;
    return config.manyChatApiKey || null;
  }

  async testConnection(tenantId: string) {
    const apiKey = await this.getApiKey(tenantId);
    if (!apiKey) {
      return {
        success: false,
        message: 'ManyChat API key not configured',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/page/getInfo`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }),
      );

      const data = (response.data as any)?.data;

      return {
        success: true,
        pageName: data?.name,
        pageId: data?.id,
      };
    } catch (error) {
      this.logger.error(`Failed to test ManyChat connection for tenant ${tenantId}`, error);
      return {
        success: false,
        message: 'Failed to connect to ManyChat',
      };
    }
  }

  async sendFlow(tenantId: string, subscriberId: string, flowNs: string) {
    const apiKey = await this.getApiKey(tenantId);
    if (!apiKey) {
      this.logger.warn(`ManyChat API Key not found for tenant ${tenantId}`);
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.BASE_URL}/sending/sendFlow`,
          {
            subscriber_id: subscriberId,
            flow_ns: flowNs,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(`Flow ${flowNs} sent to subscriber ${subscriberId}`);
    } catch (error) {
      this.logger.error(`Failed to send flow to ${subscriberId}`, error);
    }
  }

  async sendText(tenantId: string, subscriberId: string, text: string) {
    const apiKey = await this.getApiKey(tenantId);
    if (!apiKey) return;

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.BASE_URL}/sending/sendContent`,
          {
            subscriber_id: subscriberId,
            data: {
              version: 'v2',
              content: {
                messages: [
                  {
                    type: 'text',
                    text: text,
                  },
                ],
              },
            },
            message_tag: 'ACCOUNT_UPDATE', // Use carefully compliant with policies
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(`Message sent to ${subscriberId}: ${text}`);
    } catch (error) {
      this.logger.error(`Failed to send text to ${subscriberId}`, error);
    }
  }

  async notifyUser(tenantId: string, userId: string, message: string) {
      const user = await this.prisma.user.findUnique({
          where: { id: userId }
      });

      if (user && user.manyChatSubscriberId) {
          await this.sendText(tenantId, user.manyChatSubscriberId, message);
      }
  }

  async findSubscriberByEmail(tenantId: string, email: string): Promise<any> {
    const apiKey = await this.getApiKey(tenantId);
    if (!apiKey) return null;

    try {
      // ManyChat doesn't have a direct "findByEmail" in public API V1 usually, 
      // but often uses Custom Fields lookup. 
      // For V2/standard, we might need to iterate or use specific endpoints.
      // Assuming a "findByCustomField" endpoint exists or similar logic.
      // Alternatively, we use 'subscriber/findByCustomField' if available.
      
      // FALLBACK: ManyChat API is tricky with emails. 
      // Often you need to store the Subscriber ID in your DB when they first interact via Webhook.
      // Let's assume we search by custom field "email" if it exists.
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.BASE_URL}/subscriber/findByCustomField`,
          {
            params: {
              field_name: 'email',
              field_value: email,
            },
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          },
        ),
      );
      return (response.data as any)?.data;
    } catch (error) {
      this.logger.error(`Failed to find subscriber by email ${email}`, error);
      return null;
    }
  }

  async setCustomField(tenantId: string, subscriberId: string, fieldId: string, value: any) {
    const apiKey = await this.getApiKey(tenantId);
    if (!apiKey) return;

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.BASE_URL}/subscriber/setCustomField`,
          {
            subscriber_id: subscriberId,
            field_id: fieldId,
            field_value: value,
          },
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
          },
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to set custom field for ${subscriberId}`, error);
    }
  }
}
