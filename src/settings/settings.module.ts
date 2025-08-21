import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './setting.entity';
import { SettingsService } from './settings.service';

@Global() // <<-- این ماژول رو Global می‌کنیم تا سرویسش همه جا در دسترس باشه
@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingsService],
  exports: [SettingsService], // <<-- حتماً export می‌کنیم
})
export class SettingsModule {}