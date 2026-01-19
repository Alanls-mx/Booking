import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupDto } from './setup.dto';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  async checkStatus() {
    return this.setupService.isSetup();
  }

  @Post('init')
  async initialize(@Body() dto: SetupDto) {
    return this.setupService.initialize(dto);
  }
}
