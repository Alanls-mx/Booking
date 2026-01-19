import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async create(createProfessionalDto: CreateProfessionalDto) {
    const { password, role, permissions, ...professionalData } = createProfessionalDto;

    const professional = await this.prisma.professional.create({
      data: professionalData,
    });

    if (professionalData.email && password) {
      // Check if user exists
      const existingUser = await this.prisma.user.findFirst({
        where: { email: professionalData.email, tenantId: professionalData.tenantId },
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      if (existingUser) {
        // Update existing user
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            role: role || 'STAFF',
            permissions: permissions || [],
          },
        });
      } else {
        // Create new user
        await this.prisma.user.create({
          data: {
            email: professionalData.email,
            name: professionalData.name,
            password: hashedPassword,
            tenantId: professionalData.tenantId,
            role: role || 'STAFF',
            permissions: permissions || [],
            avatarUrl: professionalData.avatarUrl,
          },
        });
      }
    }

    return professional;
  }

  async findAll(tenantId: string) {
    const professionals = await this.prisma.professional.findMany({
      where: { tenantId },
      include: { workingHours: true },
    });

    // Attach user info (role, permissions) if available
    const emails = professionals.map(p => p.email).filter(Boolean) as string[];
    
    if (emails.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { 
          tenantId,
          email: { in: emails }
        }
      });

      return professionals.map(p => {
        const user = users.find(u => u.email === p.email);
        return {
          ...p,
          role: user?.role,
          permissions: user?.permissions,
          hasLogin: !!user
        };
      });
    }

    return professionals.map(p => ({ ...p, hasLogin: false }));
  }

  async findOne(id: string, tenantId: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      include: { workingHours: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    if (professional.email) {
      const user = await this.prisma.user.findFirst({
        where: { email: professional.email, tenantId }
      });
      if (user) {
        return {
          ...professional,
          role: user.role,
          permissions: user.permissions,
          hasLogin: true
        };
      }
    }

    return { ...professional, hasLogin: false };
  }

  async update(id: string, tenantId: string, updateProfessionalDto: UpdateProfessionalDto) {
    const { password, role, permissions, ...professionalData } = updateProfessionalDto;
    
    // Check if professional exists first
    const existingProfessional = await this.prisma.professional.findFirst({
        where: { id, tenantId }
    });
    
    if (!existingProfessional) {
        throw new NotFoundException('Professional not found');
    }

    const updatedProfessional = await this.prisma.professional.update({
      where: { id },
      data: professionalData,
    });

    // Handle user update if email is present (either in update or existing professional)
    const email = professionalData.email || existingProfessional.email;

    if (email) {
      const user = await this.prisma.user.findFirst({
        where: { email: email, tenantId },
      });

      const updateData: any = {};
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      if (role) {
        updateData.role = role;
      }
      if (permissions) {
        updateData.permissions = permissions;
      }

      if (Object.keys(updateData).length > 0) {
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } else if (password) {
          // Create user if it doesn't exist and password is provided
          await this.prisma.user.create({
            data: {
              email: email,
              name: updatedProfessional.name,
              password: await bcrypt.hash(password, 10),
              tenantId,
              role: role || 'STAFF',
              permissions: permissions || [],
              avatarUrl: updatedProfessional.avatarUrl,
            },
          });
        }
      }
    }

    return updatedProfessional;
  }

  async remove(id: string, tenantId: string) {
    const professional = await this.findOne(id, tenantId);

    return this.prisma.professional.delete({
      where: { id: professional.id },
    });
  }
}
