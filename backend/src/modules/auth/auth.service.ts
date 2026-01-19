import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string, tenantId: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, tenantId);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password, loginDto.tenantId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(payload.email, payload.tenantId);

    if (!user) {
      return { success: true };
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenantId: payload.tenantId,
      },
      {
        expiresIn: '1h',
      },
    );

    await (this.prisma as any).passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        tenantId: payload.tenantId,
      },
    });

    const resetBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${resetBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.emailService.sendTemplateEmail(
      payload.tenantId,
      user.email,
      'passwordReset',
      { resetLink }
    );

    return { success: true };
  }

  async resetPassword(data: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(data.token);
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }

    const resetRecord = await (this.prisma as any).passwordResetToken.findFirst({
      where: {
        token: data.token,
        userId: payload.sub,
        tenantId: payload.tenantId,
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    await (this.prisma as any).passwordResetToken.delete({
      where: { id: resetRecord.id },
    });

    return { success: true };
  }
}
