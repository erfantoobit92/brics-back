import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '../user/user.entity';
import { ConvertDto, ConversionDirection } from './dto/convert.dto';
import { SettingsService } from '../settings/settings.service'; // <<-- ایمپورت سرویس جدید

@Injectable()
export class ExchangeService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly settingsService: SettingsService, // <<-- تزریق سرویس جدید
  ) {}

  async getExchangeStatus(userId: number) {
    const user = await this.entityManager.findOneBy(User, { id: userId });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const rate = await this.settingsService.getBricsToBalanceRate(); // <<-- خواندن نرخ از دیتابیس

    return {
      balance: user.balance,
      bricsBalance: user.bricsBalance,
      rate: rate, // نرخ داینامیک
    };
  }

  async convertCurrency(userId: number, convertDto: ConvertDto) {
    const { amount, direction } = convertDto;
    
    // ۱. گرفتن آخرین نرخ تبدیل از دیتابیس
    const rate = await this.settingsService.getBricsToBalanceRate();

    return this.entityManager.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new BadRequestException('User not found.');
      }
      
      if (direction === ConversionDirection.BALANCE_TO_BRICS) {
        // می‌خواهیم `amount` واحد Brics بخریم
        // هزینه به Balance برابر است با amount * rate
        if (Number(user.balance) < amount) { // <<-- اصلاح منطق: ورودی `amount` هزینه به Balance است
          throw new BadRequestException('Insufficient balance.');
        }
        
        const receivedBrics = amount / rate;

        user.balance = Number(user.balance) - amount;
        user.bricsBalance = Number(user.bricsBalance) + receivedBrics;

      } else if (direction === ConversionDirection.BRICS_TO_BALANCE) {
        // می‌خواهیم `amount` واحد Brics را به Balance تبدیل کنیم
        if (Number(user.bricsBalance) < amount) {
          throw new BadRequestException('Insufficient Brics balance.');
        }
        
        const receivedBalance = amount * rate;
        user.bricsBalance = Number(user.bricsBalance) - amount;
        user.balance = Number(user.balance) + receivedBalance;
      }
      
      const updatedUser = await manager.save(user);

      return {
        balance: updatedUser.balance,
        bricsBalance: updatedUser.bricsBalance,
        message: 'Conversion successful!',
      };
    });
  }
}