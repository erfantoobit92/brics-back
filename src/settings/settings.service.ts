import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

export const BRICS_TO_BALANCE_RATE_KEY = 'brics_to_balance_rate';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {}

  // این تابع موقع بالا اومدن برنامه، مقدار پیش‌فرض رو در دیتابیس قرار میده
  async onModuleInit() {
    const rateSetting = await this.settingsRepository.findOne({
      where: { key: BRICS_TO_BALANCE_RATE_KEY },
    });
    if (!rateSetting) {
      await this.settingsRepository.save({
        key: BRICS_TO_BALANCE_RATE_KEY,
        value: '1000000', // پیش‌فرض: 1 بریکس = 1,000,000 بالانس (برای پشتیبانی از 0.000001)
      });
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting ? setting.value : null;
  }
  
  // پنل ادمین در آینده از این تابع استفاده خواهد کرد
  async setSetting(key: string, value: string): Promise<Setting> {
    return this.settingsRepository.save({ key, value });
  }

  async getBricsToBalanceRate(): Promise<number> {
    const rateStr = await this.getSetting(BRICS_TO_BALANCE_RATE_KEY);
    // مقدار پیش‌فرض در صورت نبودن تنظیمات
    return rateStr ? Number(rateStr) : 1000000;
  }
}