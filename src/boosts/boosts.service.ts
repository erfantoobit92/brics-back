// src/boosts/boosts.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BoostLevel } from './boost-level.entity';
import { User } from '../user/user.entity';
import { CreateBoostLevelDto } from './dto/create-boost-level.dto';
import { UpdateBoostLevelDto } from './dto/update-boost-level.dto';
import { MAX_Tap_Level } from 'src/constants';

@Injectable()
export class BoostsService {
  constructor(
    @InjectRepository(BoostLevel)
    private readonly boostLevelsRepository: Repository<BoostLevel>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly entityManager: EntityManager, // برای استفاده از Transaction
  ) {}

  async findAllForUser(userId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allLevels = await this.boostLevelsRepository.find({
      order: { level: 'ASC' },
    });

    return allLevels.map((boost) => ({
      ...boost,
      isCurrent: user.tapLevel === boost.level,
      isUnlocked: user.tapLevel >= boost.level,
      canAfford: user.balance >= boost.cost && (user.tapLevel + 1) == boost.level,
    }));
  }

  /**
   * سطح تپ کاربر رو یک واحد افزایش میده
   */
  async upgrade(userId: number) {
    // از Transaction استفاده می‌کنیم تا از race condition جلوگیری کنیم
    // این تضمین میکنه که دو درخواست همزمان باعث آپدیت اشتباه نشن
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // کاربر رو با قفل PESSIMISTIC_WRITE می‌گیریم تا هیچ درخواست دیگه‌ای نتونه همزمان تغییرش بده
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const nextLevelNumber = user.tapLevel + 1;
        const nextLevel = await transactionalEntityManager.findOneBy(
          BoostLevel,
          {
            level: nextLevelNumber,
          },
        );

        if (!nextLevel) {
          throw new BadRequestException(
            'You are already at the maximum level.',
          );
        }

        if (user.balance < nextLevel.cost) {
          throw new BadRequestException('Not enough balance to upgrade.');
        }

        // انجام آپدیت
        user.balance -= nextLevel.cost;
        user.tapLevel = nextLevelNumber;

        await transactionalEntityManager.save(user);

        return {
          message: `Successfully upgraded to level ${user.tapLevel}!`,
          newBalance: user.balance,
          newTapLevel: user.tapLevel,
        };
      },
    );
  }

  // ===============================================
  //  منطق برای ادمین (Admin CRUD Logic)
  // ===============================================

  async create(createDto: CreateBoostLevelDto): Promise<BoostLevel> {
    const existingLevel = await this.boostLevelsRepository.findOneBy({
      level: createDto.level,
    });
    if (existingLevel) {
      throw new BadRequestException(`سطح ${createDto.level} از قبل وجود دارد.`);
    }

    const totalLevels = await this.boostLevelsRepository.count();

    if (totalLevels >= MAX_Tap_Level) {
      throw new BadRequestException(
        ` بیشتر از ${MAX_Tap_Level} سطح نمی توانید ایجاد کنید!`,
      );
    }

    const newBoost = this.boostLevelsRepository.create(createDto);
    return this.boostLevelsRepository.save(newBoost);
  }

  findAll(): Promise<BoostLevel[]> {
    return this.boostLevelsRepository.find({ order: { level: 'ASC' } });
  }

  async findOne(id: number): Promise<BoostLevel> {
    const boost = await this.boostLevelsRepository.findOneBy({ id });
    if (!boost) {
      throw new NotFoundException(`Boost with ID ${id} not found`);
    }
    return boost;
  }

  async update(
    id: number,
    updateDto: UpdateBoostLevelDto,
  ): Promise<BoostLevel> {
    const boost = await this.findOne(id); // از متد findOne برای چک کردن وجود داشتن استفاده میکنیم

    // اگر ادمین بخواد شماره level رو تغییر بده و اون شماره از قبل وجود داشته باشه، ارور بده
    if (updateDto.level && updateDto.level !== boost.level) {
      const existingLevel = await this.boostLevelsRepository.findOneBy({
        level: updateDto.level,
      });
      if (existingLevel) {
        throw new BadRequestException(
          `سطح ${updateDto.level} از قبل وجود دارد.`,
        );
      }
    }

    Object.assign(boost, updateDto);
    return this.boostLevelsRepository.save(boost);
  }

  async remove(id: number): Promise<void> {
    const result = await this.boostLevelsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Boost with ID ${id} not found`);
    }
  }
}
