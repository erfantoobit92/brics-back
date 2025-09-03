import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { Setting } from '../setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [AdminSettingsService],
  controllers: [AdminSettingsController],
})
export class AdminSettingsModule {}