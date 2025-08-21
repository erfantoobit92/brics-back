import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // منطق شارژ شدن انرژی
  private refillEnergy(user: User): User {
    const now = new Date();
    const lastRefill = user.lastEnergyRefill;
    const diffSeconds = Math.floor(
      (now.getTime() - lastRefill.getTime()) / 1000,
    );

    // فرض کنیم هر ۳ ثانیه یک انرژی اضافه میشه
    const energyToAdd = Math.floor(diffSeconds / 3);

    if (energyToAdd > 0) {
      user.currentEnergy = Math.min(
        user.energyLimit,
        user.currentEnergy + energyToAdd,
      );
      user.lastEnergyRefill = now;
    }
    return user;
  }

  async getUserState(userId: number) {
    let user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // قبل از ارسال، انرژی رو آپدیت می‌کنیم تا کاربر آخرین وضعیت رو ببینه
    user = this.refillEnergy(user);
    await this.usersRepository.save(user);

    return {
      balance: user.balance,
      currentEnergy: user.currentEnergy,
      energyLimit: user.energyLimit,
      tapLevel: user.tapLevel,
      // هر اطلاعات دیگه‌ای که لازمه در شروع به فرانت بدی
    };
  }

  async processTap(userId: number, tapCount: number): Promise<any> {
    let user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    // اول انرژی رو بر اساس زمان گذشته آپدیت کن
    user = this.refillEnergy(user);

    // حالا بررسی کن انرژی برای تپ کافیه یا نه
    const tapValue = user.tapLevel; // هر تپ چقدر ارزش داره
    const totalCost = tapCount; // هر تپ یک انرژی کم میکنه

    if (user.currentEnergy >= totalCost) {
      user.currentEnergy -= totalCost;

      const currentBalance = BigInt(user.balance);
      const earnings = BigInt(tapCount * tapValue);
      user.balance = (currentBalance + earnings).toString();

      await this.usersRepository.save(user);

      return {
        success: true,
        balance: user.balance,
        currentEnergy: user.currentEnergy,
        energyLimit: user.energyLimit,
      };
    } else {
      // اگر انرژی کافی نبود، فقط وضعیت فعلی رو برگردون
      return {
        success: false,
        message: 'Not enough energy',
        balance: user.balance,
        currentEnergy: user.currentEnergy,
        energyLimit: user.energyLimit,
      };
    }
  }
}
