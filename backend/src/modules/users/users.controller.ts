import { Controller, Get, Query, UseGuards, Delete, Param, Patch, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários por tenant e role' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('tenantId') tenantId: string, 
    @Query('role') role?: Role,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.usersService.findAll(tenantId, role, page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiQuery({ name: 'tenantId', required: true })
  update(@Param('id') id: string, @Query('tenantId') tenantId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir usuário' })
  @ApiQuery({ name: 'tenantId', required: true })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.usersService.remove(id, tenantId);
  }
}
