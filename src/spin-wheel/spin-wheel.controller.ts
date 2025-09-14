// src/spin-wheel/spin-wheel.controller.ts
import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { SpinWheelService } from './spin-wheel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('spin-wheel')
@UseGuards(JwtAuthGuard)
export class SpinWheelController {
  constructor(private readonly spinWheelService: SpinWheelService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Get('status')
  getStatus(@Req() req) {
    const userId = req.user.sub;
    return this.spinWheelService.getStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('spin')
  spin(@Req() req) {
    const userId = req.user.sub;
    return this.spinWheelService.spin(userId);
  }
}
