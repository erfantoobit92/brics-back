// src/game/game.controller.ts

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // از گارد استاندارد HTTP استفاده می‌کنیم
import { GameService } from './game.service';
import { Request } from 'express';
import { IsInt, Min } from 'class-validator';
import { Roles } from 'src/auth/decorators/roles.decorator';

// یک DTO برای ولیدیشن داده‌های ورودی
class TapDto {
  @IsInt()
  @Min(1)
  count: number;
}

@Controller('game') // تمام روت‌های این کنترلر با /game شروع میشن
export class GameController {
  constructor(private readonly gameService: GameService) {}

  /**
   * این endpoint اطلاعات اولیه بازی کاربر رو برمی‌گردونه
   * (جایگزین event initial_state در سوکت)
   */

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Get('state')
  async getGameState(@Req() req) {
    // req.user توسط JwtAuthGuard به درخواست اضافه میشه
    const userId = req.user.sub;
    return this.gameService.getUserState(userId);
  }

  /**
   * این endpoint تپ‌های کاربر رو پردازش می‌کنه
   * (جایگزین event tap در سوکت)
   */
  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('tap')
  async processTaps(@Req() req, @Body(new ValidationPipe()) body: TapDto) {
    const userId = req.user.sub;
    const { count } = body;
    return this.gameService.processTap(userId, count);
  }
}
