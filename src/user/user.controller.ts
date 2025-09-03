import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('admin/users')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.findAll(page, limit);
  }

  @Roles('user')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.findOne(req.user.sub);
  }

  @Roles('user')
  @UseGuards(JwtAuthGuard)
  @Get('referrals')
  getReferrals(@Request() req) {
    const userId = req.user.sub;
    return this.userService.findReferrals(userId);
  }

  @Roles('user')
  @Post('connect-wallet')
  @UseGuards(JwtAuthGuard)
  async connectWallet(
    @Req() req,
    @Body() connectWalletDto: ConnectWalletDto,
  ) {
    const userId = req.user.id;
    const { walletAddress } = connectWalletDto;
    return this.userService.handleWalletConnection(userId, walletAddress);
  }
}
