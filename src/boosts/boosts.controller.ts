// src/boosts/boosts.controller.ts

import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { BoostsService } from './boosts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // گارد JWT خودتون رو ایمپورت کنید
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('boosts')
export class BoostsController {
  constructor(private readonly boostsService: BoostsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('user')
  findAllForUser(@Req() req) {
    const userId = req.user.sub; // یا هرجوری که userId رو از توکن درمیارید
    return this.boostsService.findAllForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('upgrade')
  upgrade(@Req() req) {
    const userId = req.user.sub;
    return this.boostsService.upgrade(userId);
  }
}
