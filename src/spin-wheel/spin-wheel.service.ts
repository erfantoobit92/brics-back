// src/spin-wheel/spin-wheel.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SpinWheelItem, SpinRewardType } from './entity/spin-wheel-item.entity';
import { User } from '../user/user.entity';
import { CreateSpinItemDto } from './dto/create-spin-item.dto';
import { UpdateSpinItemDto } from './dto/update-spin-item.dto';

const SPIN_COOLDOWN_HOURS = 24; // هر 24 ساعت یکبار

@Injectable()
export class SpinWheelService {
  constructor(
    @InjectRepository(SpinWheelItem)
    private readonly itemsRepository: Repository<SpinWheelItem>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  // ===============================================
  //  منطق برای کاربر
  // ===============================================

  /**
   * وضعیت گردونه شانس برای کاربر رو برمی‌گردونه
   */
  async getStatus(userId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const lastSpin = user.lastSpinAt;
    
    let canSpin = true;
    let nextSpinAvailableAt: Date | null = null;

    if (lastSpin) {
      const cooldownPeriod = SPIN_COOLDOWN_HOURS * 60 * 60 * 1000; // به میلی‌ثانیه
      const nextSpinTime = new Date(lastSpin.getTime() + cooldownPeriod);

      if (now < nextSpinTime) {
        canSpin = false;
        nextSpinAvailableAt = nextSpinTime;
      }
    }
    
    const items = await this.itemsRepository.find({ where: { isActive: true }, order: { id: 'ASC' } });

    return {
      canSpin,
      nextSpinAvailableAt,
      items, // لیست جوایز رو هم می‌فرستیم تا فرانت‌اند بتونه گردونه رو رندر کنه
    };
  }

  /**
   * گردونه رو برای کاربر می‌چرخونه
   */
  async spin(userId: number) {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');

      // 1. بررسی کول‌داون (زمان انتظار)
      const status = await this.getStatus(userId);
      if (!status.canSpin) {
        throw new BadRequestException('You cannot spin the wheel yet.');
      }

      // 2. انتخاب جایزه بر اساس وزن (Weighted Random Selection)
      const prize = await this.selectPrize();
      if (!prize) {
        throw new Error('No active prizes available in the spin wheel.');
      }

      // 3. اعمال جایزه به کاربر
      switch (prize.type) {
        case SpinRewardType.COIN:
          user.balance = Number(user.balance) + Number(prize.value);
          break;
        case SpinRewardType.BRICS:
          user.bricsBalance = Number(user.bricsBalance) + Number(prize.value);
          break;
        // انواع جوایز دیگر رو اینجا هندل کن
      }
      
      // 4. آپدیت زمان آخرین چرخش و ذخیره کاربر
      user.lastSpinAt = new Date();
      await transactionalEntityManager.save(user);

      return {
        success: true,
        wonPrize: prize, // جایزه‌ای که برنده شده
        newBalance: user.balance,
        newEnergy: user.currentEnergy,
      };
    });
  }

  /**
   * یک جایزه رو به صورت شانسی بر اساس وزن‌ها انتخاب می‌کنه
   */
  private async selectPrize(): Promise<SpinWheelItem | null> {
    const activeItems = await this.itemsRepository.find({ where: { isActive: true } });
    if (activeItems.length === 0) return null;

    const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const item of activeItems) {
      if (randomNum < item.weight) {
        return item;
      }
      randomNum -= item.weight;
    }
    
    return activeItems[activeItems.length - 1]; // Fallback
  }


  // ===============================================
  //  منطق CRUD برای ادمین
  // ===============================================
  
  async create(dto: CreateSpinItemDto) {
    const itemCount = await this.itemsRepository.count();
    if (itemCount >= 8) {
      throw new BadRequestException('Cannot have more than 8 items in the spin wheel.');
    }
    const newItem = this.itemsRepository.create(dto);
    return this.itemsRepository.save(newItem);
  }

  findAll() {
    return this.itemsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const item = await this.itemsRepository.findOneBy({ id });
    if (!item) throw new NotFoundException(`Item with ID ${id} not found.`);
    return item;
  }
  
  async update(id: number, dto: UpdateSpinItemDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.itemsRepository.save(item);
  }

  async remove(id: number) {
    const result = await this.itemsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Item with ID ${id} not found.`);
    }
  }
}