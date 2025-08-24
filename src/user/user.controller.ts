import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConnectWalletDto } from './dto/connect-wallet.dto'; // Import the DTO

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

  @Post('connect-wallet')
  @UseGuards(JwtAuthGuard)
  async connectWallet(
    @Req() req,
    @Body() connectWalletDto: ConnectWalletDto, // Use the DTO
  ) {
    const userId = req.user.id;
    const { walletAddress } = connectWalletDto;
    return this.userService.handleWalletConnection(userId, walletAddress);
  }
}
