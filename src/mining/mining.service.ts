import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThan } from 'typeorm';
import { Hardware } from './entities/hardware.entity';
import { HardwareLevel } from './entities/hardware-level.entity';
import { UserHardware } from './entities/user-hardware.entity';
import { User } from '../user/user.entity';
import { MINING_DURATION_HOURS } from 'src/constants';

@Injectable()
export class MiningService implements OnModuleInit {
  constructor(
    @InjectRepository(Hardware)
    private hardwareRepository: Repository<Hardware>,
    @InjectRepository(HardwareLevel)
    private hardwareLevelRepository: Repository<HardwareLevel>,
    @InjectRepository(UserHardware) // ریپازیتوری جدید رو اضافه کن
    private userHardwareRepository: Repository<UserHardware>,
    @InjectRepository(User) // ریپازیتوری User رو تزریق کن
    private userRepository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  // این متد فقط یک بار وقتی ماژول بالا میاد اجرا میشه
  async onModuleInit() {
    await this.seedHardwares();
  }

  private async seedHardwares() {
    const count = await this.hardwareRepository.count();
    if (count > 0) return; // اگر داده وجود داشت، دوباره نساز

    console.log('Seeding initial hardware data...');

    // سخت‌افزار اول: GPU Farm
    const gpuFarm = await this.hardwareRepository.save({
      name: 'GPU Farm',
      description: 'A powerful farm of GPUs mining Brics coins 24/7.',
      maxLevel: 10,
    });

    for (let i = 1; i <= 10; i++) {
      await this.hardwareLevelRepository.save({
        hardware: gpuFarm,
        level: i,
        bricsPerHour: i * 0.001, // 0.001 Brics/h for level 1, 0.002 for level 2, etc.
        upgradeCostCoins: 1000 * Math.pow(2, i), // 2000, 4000, 8000, etc.
        upgradeCostBrics: 0,
      });
    }

    // سخت‌افزار دوم: Solar Panel
    const solarPanel = await this.hardwareRepository.save({
      name: 'Solar Panel',
      description: 'Eco-friendly mining using the power of the sun.',
      maxLevel: 5,
    });

    for (let i = 1; i <= 5; i++) {
      await this.hardwareLevelRepository.save({
        hardware: solarPanel,
        level: i,
        bricsPerHour: i * 0.005,
        upgradeCostCoins: 5000 * Math.pow(3, i),
        upgradeCostBrics: i * 0.1, // برای آپگرید این یکی، Brics هم لازمه
      });
    }

    console.log('Hardware data seeded successfully.');
  }

  async getConsolidatedState(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // بخش اول: گرفتن اطلاعات سخت‌افزارها (شبیه getFullMiningState قبلی)
    const allHardwares = await this.hardwareRepository.find({
      relations: ['levels'],
      order: { id: 'ASC' },
    });

    let userHardwares = await this.userHardwareRepository.find({
      where: { userId },
    });

    if (userHardwares.length < allHardwares.length) {
       // منطق ساختن سخت‌افزار برای کاربرانی که ندارند (بدون تغییر)
       const existingHardwareIds = new Set(userHardwares.map((uh) => uh.hardwareId));
       const missingHardwares = allHardwares.filter((hw) => !existingHardwareIds.has(hw.id));
       const newUserHardwares = missingHardwares.map((hw) => this.userHardwareRepository.create({ userId, hardwareId: hw.id, currentLevel: 0 }));
       const savedNewHardwares = await this.userHardwareRepository.save(newUserHardwares);
       userHardwares = [...userHardwares, ...savedNewHardwares];
    }
    
    const hardwareDetails = allHardwares.map((hw) => {
        const userHw = userHardwares.find((uh) => uh.hardwareId === hw.id);
        if (!userHw) throw new Error(`Inconsistency: UserHardware not found for hardware ${hw.id}`);
        
        const currentLevelInfo = hw.levels.find((l) => l.level === userHw.currentLevel);
        const nextLevelInfo = hw.levels.find((l) => l.level === userHw.currentLevel + 1);

        return {
            id: hw.id,
            userHardwareId: userHw.id,
            name: hw.name,
            description: hw.description,
            currentLevel: userHw.currentLevel,
            bricsPerHour: currentLevelInfo ? Number(currentLevelInfo.bricsPerHour) : 0,
            lastClaimTimestamp: userHw.lastClaimTimestamp.toISOString(),
            storageHours: hw.storageHours,
            nextLevel: nextLevelInfo ? {
                level: nextLevelInfo.level,
                bricsPerHour: Number(nextLevelInfo.bricsPerHour),
                costCoins: String(nextLevelInfo.upgradeCostCoins),
                costBrics: Number(nextLevelInfo.upgradeCostBrics),
            } : null,
        };
    });

    // بخش دوم: محاسبه وضعیت کلی ماینینگ (شبیه getMiningState قبلی)
    const totalBricsPerHour = hardwareDetails.reduce((sum, hw) => sum + hw.bricsPerHour, 0);
    const claimableBrics = await this.calculateClaimableBrics(user, totalBricsPerHour);
    
    let miningStopTime: Date | null = null;
    if (user.lastSeenInMinePage) {
      miningStopTime = new Date(
        user.lastSeenInMinePage.getTime() + MINING_DURATION_HOURS * 3600 * 1000,
      );
    }
    
    // برگرداندن یک آبجکت کامل و جامع
    return {
      isMiningActive: user.isMiningActive,
      totalBricsPerHour,
      claimableBrics,
      miningStopTime: miningStopTime ? miningStopTime.toISOString() : null,
      hardwares: hardwareDetails, // <--- آرایه سخت‌افزارها هم اینجاست
    };
  }


  async getFullMiningState(userId: number) {
    // 1. تمام سخت‌افزارهای کلی و سطوحشون رو از دیتابیس بگیر
    const allHardwares = await this.hardwareRepository.find({
      relations: ['levels'],
      order: { id: 'ASC' },
    });

    // 2. تمام سخت‌افزارهای این کاربر خاص رو بگیر
    let userHardwares = await this.userHardwareRepository.find({
      where: { userId },
    });

    // 3. اگر کاربر هیچ سخت‌افزاری نداشت، براش رکوردهای اولیه رو بساز
    if (userHardwares.length < allHardwares.length) {
      const existingHardwareIds = new Set(
        userHardwares.map((uh) => uh.hardwareId),
      );
      const missingHardwares = allHardwares.filter(
        (hw) => !existingHardwareIds.has(hw.id),
      );

      const newUserHardwares = missingHardwares.map((hw) => {
        return this.userHardwareRepository.create({
          userId,
          hardwareId: hw.id,
          currentLevel: 0,
        });
      });
      const savedNewHardwares =
        await this.userHardwareRepository.save(newUserHardwares);
      userHardwares = [...userHardwares, ...savedNewHardwares];
    }

    // 4. داده‌ها رو با هم ترکیب کن تا یک خروجی تمیز برای فرانت بسازی
    //    اینجا 'state' تعریف و مقداردهی اولیه میشه
    const state = allHardwares.map((hw) => {
      const userHw = userHardwares.find((uh) => uh.hardwareId === hw.id);
      if (!userHw) {
        // این نباید اتفاق بیفته چون در مرحله 3 ساختیمش
        throw new Error(
          `Inconsistency: UserHardware not found for hardware ${hw.id}`,
        );
      }

      const currentLevelInfo = hw.levels.find(
        (l) => l.level === userHw.currentLevel,
      );
      const nextLevelInfo = hw.levels.find(
        (l) => l.level === userHw.currentLevel + 1,
      );

      return {
        id: hw.id,
        userHardwareId: userHw.id,
        name: hw.name,
        description: hw.description,
        currentLevel: userHw.currentLevel,
        bricsPerHour: currentLevelInfo
          ? Number(currentLevelInfo.bricsPerHour)
          : 0,
        lastClaimTimestamp: userHw.lastClaimTimestamp.toISOString(),
        storageHours: hw.storageHours,
        nextLevel: nextLevelInfo
          ? {
              level: nextLevelInfo.level,
              bricsPerHour: Number(nextLevelInfo.bricsPerHour),
              costCoins: String(nextLevelInfo.upgradeCostCoins),
              costBrics: Number(nextLevelInfo.upgradeCostBrics),
            }
          : null,
      };
    });

    // 5. محاسبات جدید برای وضعیت کلی ماینینگ
    let overallLastClaim: Date | null = null;
    let minStorageHours: number | null = null;

    const activeUserHardwares = userHardwares.filter(
      (uh) => uh.currentLevel > 0,
    );

    if (activeUserHardwares.length > 0) {
      overallLastClaim = activeUserHardwares.reduce((oldest, hw) =>
        hw.lastClaimTimestamp < oldest.lastClaimTimestamp ? hw : oldest,
      ).lastClaimTimestamp;

      minStorageHours = activeUserHardwares.reduce((min, uh) => {
        const hwInfo = allHardwares.find((h) => h.id === uh.hardwareId);
        const currentStorage = hwInfo ? hwInfo.storageHours : Infinity;
        return Math.min(min, currentStorage);
      }, Infinity);
    }

    // 6. در نهایت، آبجکت کامل رو برمی‌گردونیم. حالا 'state' وجود داره
    return {
      hardwares: state,
      miningStatus: {
        lastClaimTimestamp: overallLastClaim
          ? overallLastClaim.toISOString()
          : null,
        storageHours: minStorageHours === Infinity ? null : minStorageHours,
      },
    };
  }

  async upgradeHardware(userId: number, userHardwareId: number) {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // 1. قفل کردن و خواندن رکوردهای اصلی که قرار است آپدیت شوند
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        // UserHardware رو به تنهایی و با قفل می‌خونیم
        const userHardware = await transactionalEntityManager.findOne(
          UserHardware,
          {
            where: { id: userHardwareId, userId: userId },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (!user || !userHardware) {
          throw new BadRequestException('Invalid user or hardware.');
        }

        // 2. حالا اطلاعات جانبی (relations) را بدون قفل می‌خوانیم
        // این اطلاعات برای محاسبات لازمند ولی آپدیت نمی‌شوند، پس نیازی به قفل ندارند
        const hardwareInfo = await this.hardwareRepository.findOne({
          where: { id: userHardware.hardwareId },
          relations: ['levels'],
        });

        if (!hardwareInfo) {
          throw new BadRequestException('Hardware definition not found.');
        }

        // 3. پیدا کردن اطلاعات سطح بعدی (از hardwareInfo که بدون قفل خواندیم)
        const nextLevel = hardwareInfo.levels.find(
          (level) => level.level === userHardware.currentLevel + 1,
        );

        if (!nextLevel) {
          throw new BadRequestException(
            'Max level reached or next level not defined.',
          );
        }

        // 4. چک کردن موجودی و بقیه منطق (بدون تغییر)
        const costCoins = BigInt(nextLevel.upgradeCostCoins);
        const costBrics = Number(nextLevel.upgradeCostBrics);

        if (
          BigInt(user.balance) < costCoins ||
          Number(user.bricsBalance) < costBrics
        ) {
          throw new BadRequestException('Not enough funds.');
        }

        // 5. کم کردن هزینه
        user.balance = (BigInt(user.balance) - costCoins).toString();
        user.bricsBalance = Number(user.bricsBalance) - costBrics;

        // 6. آپدیت کردن سطح
        userHardware.currentLevel += 1;

        // 7. ذخیره رکوردهای اصلی که تغییر کرده‌اند
        await transactionalEntityManager.save(user);
        await transactionalEntityManager.save(userHardware);

        console.log(
          `User ${userId} upgraded hardware ${hardwareInfo.name} to level ${userHardware.currentLevel}`,
        );

        // 8. برگرداندن وضعیت جدید
        return this.getFullMiningState(userId);
      },
    );
  }

  private async calculateClaimableBrics(
    user: User,
    totalBricsPerHour: number,
  ): Promise<number> {
    if (
      !user.isMiningActive ||
      !user.miningStartedAt ||
      !user.lastSeenInMinePage
    ) {
      return 0;
    }

    const now = new Date();
    const lastClaimTime = user.lastClaimTimestamp || user.miningStartedAt;
    const miningStopTime = new Date(
      user.lastSeenInMinePage.getTime() + MINING_DURATION_HOURS * 3600 * 1000,
    );

    const effectiveEndTime = now < miningStopTime ? now : miningStopTime;

    if (effectiveEndTime <= lastClaimTime) {
      return 0;
    }

    const secondsPassed =
      (effectiveEndTime.getTime() - lastClaimTime.getTime()) / 1000;
    const hoursPassed = secondsPassed / 3600;

    return hoursPassed * totalBricsPerHour;
  }

  /**
   * نرخ کل تولید Brics بر ساعت را برای کاربر محاسبه می‌کند
   */
  private async getTotalBricsPerHour(userId: number): Promise<number> {
    const userHardwares = await this.userHardwareRepository.find({
      where: { userId, currentLevel: MoreThan(0) },
    });
    if (userHardwares.length === 0) return 0;

    const hardwareIds = userHardwares.map((uh) => uh.hardwareId);
    const levels = userHardwares.map((uh) => uh.currentLevel);

    const levelInfos = await this.hardwareLevelRepository
      .createQueryBuilder('hl')
      .where('hl.hardwareId IN (:...hardwareIds)', { hardwareIds })
      .andWhere('hl.level IN (:...levels)', { levels })
      .getMany();

    return levelInfos.reduce((sum, info) => sum + Number(info.bricsPerHour), 0);
  }

  /**
   * [GET /state] وضعیت کامل ماینینگ را برای فرانت‌اند ارسال می‌کند
   */
  async getMiningState(userId: number) {
        return this.getConsolidatedState(userId);

    // const user = await this.userRepository.findOneBy({ id: userId });

    // if (!user) {
    //   throw new BadRequestException('User not found.');
    // }

    // const totalBricsPerHour = await this.getTotalBricsPerHour(userId);
    // const claimableBrics = await this.calculateClaimableBrics(
    //   user,
    //   totalBricsPerHour,
    // );

    // let miningStopTime: Date | null = null;
    // if (user.lastSeenInMinePage) {
    //   miningStopTime = new Date(
    //     user.lastSeenInMinePage.getTime() + MINING_DURATION_HOURS * 3600 * 1000,
    //   );
    // }

    // return {
    //   isMiningActive: user.isMiningActive,
    //   totalBricsPerHour,
    //   claimableBrics,
    //   miningStopTime: miningStopTime ? miningStopTime.toISOString() : null,
    //   lastClaimTimestamp: user.lastClaimTimestamp
    //     ? user.lastClaimTimestamp.toISOString()
    //     : null,
    // };
  }

  /**
   * [POST /start] کاربر وارد صفحه ماین شده. ماینینگ را شروع یا تمدید می‌کند.
   */
  async startOrRenewMining(userId: number) {
   const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const now = new Date();
    if (!user.isMiningActive) {
      user.miningStartedAt = now;
      user.lastClaimTimestamp = now;
    }
    user.isMiningActive = true;
    user.lastSeenInMinePage = now;
    await this.userRepository.save(user);

    // حالا از متد جامع استفاده می‌کنیم تا خروجی همیشه یکسان باشه
    return this.getConsolidatedState(userId);
  }

  /**
   * [POST /heartbeat] کاربر حضورش را اعلام می‌کند.
   */
  async recordHeartbeat(userId: number) {
    await this.userRepository.update(
      { id: userId, isMiningActive: true },
      {
        lastSeenInMinePage: new Date(),
      },
    );
    return { status: 'ok' };
  }

  async claimBrics(userId: number) {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new BadRequestException('User not found.');
        }

        const totalBricsPerHour = await this.getTotalBricsPerHour(userId);
        const claimableBrics = await this.calculateClaimableBrics(
          user,
          totalBricsPerHour,
        );

        if (claimableBrics <= 0) {
          throw new BadRequestException('No brics to claim.');
        }

        user.bricsBalance = Number(user.bricsBalance) + claimableBrics;
        user.lastClaimTimestamp = new Date();

        // اگر زمان ماینینگ تمام شده بود، ماینر را خاموش می‌کنیم
        if (user.lastSeenInMinePage) {
          const miningStopTime = new Date(
            user.lastSeenInMinePage.getTime() +
              MINING_DURATION_HOURS * 3600 * 1000,
          );
          if (new Date() > miningStopTime) {
            user.isMiningActive = false;
          }
        } else {
          // اگر به هر دلیلی lastSeenInMinePage نال بود، یعنی اصلاً ماینینگ فعالی وجود نداشته
          user.isMiningActive = false;
        }

        await transactionalEntityManager.save(user);

        return this.getMiningState(userId);
      },
    );
  }
}
