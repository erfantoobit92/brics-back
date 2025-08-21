import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard) // این روت محافظت شده است
  @Get('profile')
  getProfile(@Request() req) {
    // req.user توسط JwtAuthGuard به ریکوئست اضافه شده
    return this.userService.findOne(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('referrals')
  getReferrals(@Request() req) {
    const userId = req.user.sub;
    return this.userService.findReferrals(userId);
  }
}
