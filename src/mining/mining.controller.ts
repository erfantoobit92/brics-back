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

@UseGuards(JwtAuthGuard)
@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Get('/status')
  async getStatus(@Req() req) {
    // اینجا از .sub استفاده می‌کنیم
    return this.miningService.getMiningStatus(req.user.sub);
  }

  @Post('/claim')
  async claim(@Req() req) {
    // اینجا هم از .sub استفاده می‌کنیم
    return this.miningService.claimRewards(req.user.sub);
  }

  @Post('/upgrade/:userHardwareId')
  async upgrade(
    @Req() req,
    @Param('userHardwareId', ParseIntPipe) userHardwareId: number,
  ) {
    // و اینجا هم از .sub استفاده می‌کنیم
    return this.miningService.upgradeHardware(req.user.sub, userHardwareId);
  }

  @Get('/seed')
  async seed() {
    return this.miningService.seedInitialData();
  }
}
