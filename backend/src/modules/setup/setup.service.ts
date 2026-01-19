import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetupDto } from './setup.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}

  async isSetup(): Promise<{ isSetup: boolean; dbConnected: boolean }> {
    let dbConnected = false;
    let tenantCount = 0;

    try {
      tenantCount = await this.prisma.tenant.count();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      dbConnected = false;
    }

    return {
      isSetup: tenantCount > 0,
      dbConnected,
    };
  }

  async initialize(dto: SetupDto) {
    // 1. Check if already set up
    const { isSetup } = await this.isSetup();
    if (isSetup) {
      throw new BadRequestException('System is already set up.');
    }

    // 2. Handle Database Configuration (if provided)
    if (dto.databaseUrl) {
      const currentDbUrl = process.env.DATABASE_URL;
      if (dto.databaseUrl !== currentDbUrl) {
        // Attempt to write to .env
        try {
          this.updateEnvFile('DATABASE_URL', dto.databaseUrl);
          // Note: In most Node.js setups, changing .env requires a restart.
          // We will return a specific flag indicating a restart is needed if the DB URL changed.
        } catch (error) {
          console.error('Failed to update .env file:', error);
          throw new InternalServerErrorException('Failed to save database configuration.');
        }
      }
    }

    // 3. Create Tenant
    const slug = dto.slug || dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Default config with modules
    const config = {
      modules: {
        appointments: dto.modules?.appointments ?? true,
        crm: dto.modules?.crm ?? true,
        financial: dto.modules?.financial ?? true,
        website: dto.modules?.website ?? true,
      },
      ...dto.modules
    };

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.businessName,
        slug,
        logo: dto.logo,
        primaryColor: dto.primaryColor,
        config,
        // Create Admin User
        users: {
          create: {
            email: dto.adminEmail,
            name: dto.adminName,
            password: await bcrypt.hash(dto.adminPassword, 10),
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    });

    return {
      success: true,
      tenantId: tenant.id,
      adminId: tenant.users[0].id,
      requiresRestart: !!dto.databaseUrl && dto.databaseUrl !== process.env.DATABASE_URL,
    };
  }

  private updateEnvFile(key: string, value: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}="${value}"`);
      } else {
        envContent += `\n${key}="${value}"`;
      }
      
      fs.writeFileSync(envPath, envContent);
    } else {
      // Create new .env
      fs.writeFileSync(envPath, `${key}="${value}"`);
    }
  }
}
