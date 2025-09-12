import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { MiningService } from './mining.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Get('/status')
  async getStatus(@Req() req) {
    return this.miningService.getMiningStatus(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('/claim')
  async claim(@Req() req) {
    return this.miningService.claimRewards(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('/upgrade/:userHardwareId')
  async upgrade(
    @Req() req,
    @Param('userHardwareId', ParseIntPipe) userHardwareId: number,
  ) {
    return this.miningService.upgradeHardware(req.user.sub, userHardwareId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('/buy/:hardwareId')
  async buyHardware(
    @Req() req,
    @Param('hardwareId', ParseIntPipe) hardwareId: number,
  ) {
    return this.miningService.buyHardware(req.user.sub, hardwareId);
  }

  // FOR TEST
  // @Get('/seed')
  // async seed() {
  //   return this.miningService.seedInitialData();
  // }
}
