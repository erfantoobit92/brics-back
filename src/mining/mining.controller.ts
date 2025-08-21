import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MiningService } from './mining.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class UpgradeHardwareDto {
  userHardwareId: number;
}

@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

 @UseGuards(JwtAuthGuard)
  @Get('state')
  getMiningState(@Request() req) {
    const userId = req.user.sub;
    // از متد اصلی سرویس استفاده می‌کنیم
    return this.miningService.getConsolidatedState(req.user.sub);
  }
  
  // @UseGuards(JwtAuthGuard)
  // @Get('state')
  // getMiningState(@Request() req) {
  //   const userId = req.user.sub;
  //   return this.miningService.getFullMiningState(userId);
  // }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  startMining(@Request() req) {
    const userId = req.user.sub;
    return this.miningService.startOrRenewMining(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('heartbeat')
  recordHeartbeat(@Request() req) {
    const userId = req.user.sub;
    return this.miningService.recordHeartbeat(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  upgradeHardware(@Request() req, @Body() upgradeDto: UpgradeHardwareDto) {
    const userId = req.user.sub;
    const { userHardwareId } = upgradeDto;
    return this.miningService.upgradeHardware(userId, userHardwareId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  claimBrics(@Request() req) {
    const userId = req.user.sub;
    return this.miningService.claimBrics(userId);
  }
}
