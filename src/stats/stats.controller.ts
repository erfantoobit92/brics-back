import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }
}