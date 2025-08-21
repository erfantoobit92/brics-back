import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Repository, EntityManager } from 'typeorm';
import { UserHardware } from './entities/user-hardware.entity';
import { HardwareLevel } from './entities/hardware-level.entity';
import { Hardware } from './entities/hardware.entity';

const MAX_OFFLINE_MINING_HOURS = 2;
const MAX_OFFLINE_MINING_SECONDS = MAX_OFFLINE_MINING_HOURS * 3600;

@Injectable()
export class MiningService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Hardware)
    private readonly hardwareRepository: Repository<Hardware>,
    private readonly entityManager: EntityManager,
  ) {}

  // =================================================================
  //  PRIVATE HELPER METHODS
  // =================================================================

  private async _updateAndGetUserMiningStatus(
    userId: number,
    manager: EntityManager,
  ): Promise<{ user: User; totalMiningRatePerHour: number }> {
    const userRepository = manager.getRepository(User);
    const hardwareLevelRepository = manager.getRepository(HardwareLevel);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['hardwares', 'hardwares.hardware'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const now = new Date();
    const lastInteraction = user.lastMiningInteraction;
    const timeDiffInSeconds = Math.floor(
      (now.getTime() - lastInteraction.getTime()) / 1000,
    );
    const effectiveMiningSeconds = Math.max(
      0,
      Math.min(timeDiffInSeconds, MAX_OFFLINE_MINING_SECONDS),
    );

    let totalMiningRatePerHour = 0;
    if (user.hardwares?.length > 0) {
      const userHardwareLevels = await Promise.all(
        user.hardwares.map((uh) =>
          hardwareLevelRepository.findOne({
            where: { hardware: { id: uh.hardware.id }, level: uh.level },
          }),
        ),
      );
      userHardwareLevels.forEach((levelInfo) => {
        if (levelInfo)
          totalMiningRatePerHour += Number(levelInfo.miningRatePerHour);
      });
    }

    if (effectiveMiningSeconds > 0 && totalMiningRatePerHour > 0) {
      const newlyMined =
        (totalMiningRatePerHour / 3600) * effectiveMiningSeconds;
      user.unclaimedMiningReward =
        Number(user.unclaimedMiningReward) + newlyMined;
    }

    user.lastMiningInteraction = now;
    const updatedUser = await manager.save(user);

    return { user: updatedUser, totalMiningRatePerHour };
  }

  /**
   * یک متد کمکی جدید برای ساختن آبجکت پاسخ برای فرانت‌اند
   */
  private async _prepareResponseData(
    user: User,
    totalMiningRatePerHour: number,
    manager: EntityManager,
  ) {
    const allHardwares = await manager.find(Hardware); // ۱. گرفتن لیست کامل سخت‌افزارها
    const hardwareLevelRepository = manager.getRepository(HardwareLevel);

    const combinedHardwares = await Promise.all(
      allHardwares.map(async (hardware) => {
        // ۲. پیدا کردن سخت‌افزار کاربر در لیست سخت‌افزارهای او
        const userHardwareInstance = user.hardwares.find(
          (uh) => uh.hardware.id === hardware.id,
        );
        if (userHardwareInstance) {
          const currentLevel = userHardwareInstance
            ? userHardwareInstance.level
            : 0;

          if (currentLevel > 0) {
            // ۳. کاربر این سخت‌افزار را دارد -> اطلاعات آپگرید را پیدا می‌کنیم
            const [currentLevelInfo, nextLevelInfo] = await Promise.all([
              hardwareLevelRepository.findOne({
                where: { hardware: { id: hardware.id }, level: currentLevel },
              }),
              hardwareLevelRepository.findOne({
                where: {
                  hardware: { id: hardware.id },
                  level: currentLevel + 1,
                },
              }),
            ]);
            return {
              id: userHardwareInstance.id, // ID نمونه سخت‌افزار کاربر
              hardwareId: hardware.id,
              name: hardware.name,
              level: currentLevel,
              isOwned: true,
              currentMiningRatePerHour: currentLevelInfo
                ? Number(currentLevelInfo.miningRatePerHour)
                : 0,
              nextLevelUpgradeCost: nextLevelInfo
                ? Number(nextLevelInfo.upgradeCost)
                : null,
              isMaxLevel: !nextLevelInfo,
            };
          } else {
            // ۴. کاربر این سخت‌افزار را ندارد -> اطلاعات خرید (سطح ۱) را پیدا می‌کنیم
            const firstLevelInfo = await hardwareLevelRepository.findOne({
              where: { hardware: { id: hardware.id }, level: 1 },
            });
            return {
              id: null, // کاربر هنوز این نمونه را ندارد
              hardwareId: hardware.id,
              name: hardware.name,
              level: 0,
              isOwned: false,
              currentMiningRatePerHour: 0,
              buyCost: firstLevelInfo
                ? Number(firstLevelInfo.upgradeCost)
                : null, // هزینه خرید در واقع هزینه آپگرید از سطح ۰ به ۱ است
              isMaxLevel: false,
            };
          }
        } else {
          // اگر پیدا نشد -> کاربر این سخت‌افزار را ندارد
          //   const firstLevelInfo = await hardwareLevelRepository.findOne({
          //     where: { hardware: { id: hardware.id }, level: 1 },
          //   });

          return {
            id: null,
            hardwareId: hardware.id,
            name: hardware.name,
            level: 0,
            isOwned: false,
            // ... (بقیه پراپرتی‌ها)
          };
        }
      }),
    );

    return {
      unclaimedMiningReward: user.unclaimedMiningReward,
      bricsBalance: user.bricsBalance,
      balance: user.balance,
      totalMiningRatePerHour,
      hardwares: combinedHardwares, // <<-- لیست ترکیبی جدید
    };
  }

  // =================================================================
  //  PUBLIC API METHODS
  // =================================================================

  async getMiningStatus(userId: number) {
    const { user, totalMiningRatePerHour } =
      await this._updateAndGetUserMiningStatus(userId, this.entityManager);
    return this._prepareResponseData(
      user,
      totalMiningRatePerHour,
      this.entityManager,
    );
  }

  async upgradeHardware(userId: number, userHardwareId: number) {
    return this.entityManager.transaction(async (manager) => {
      // 1. آپدیت وضعیت و گرفتن کاربر جدید
      const { user: updatedUser, totalMiningRatePerHour } =
        await this._updateAndGetUserMiningStatus(userId, manager);

      // 2. منطق آپگرید
      const userHardware = await manager.findOne(UserHardware, {
        where: { id: userHardwareId, user: { id: userId } },
        relations: ['hardware'],
      });
      if (!userHardware) {
        throw new NotFoundException('User hardware not found.');
      }

      const nextLevelInfo = await manager.getRepository(HardwareLevel).findOne({
        where: {
          hardware: { id: userHardware.hardware.id },
          level: userHardware.level + 1,
        },
      });
      if (!nextLevelInfo) {
        throw new BadRequestException('Hardware is already at max level.');
      }

      const upgradeCost = Number(nextLevelInfo.upgradeCost);
      if (Number(updatedUser.balance) < upgradeCost) {
        throw new BadRequestException('Insufficient balance for upgrade.');
      }

      updatedUser.balance = (
        Number(updatedUser.balance) - upgradeCost
      ).toString();
      userHardware.level += 1;

      // 3. ذخیره هر دو موجودیت
      await manager.save([updatedUser, userHardware]); // می‌توان به صورت همزمان ذخیره کرد

      // 4. ساختن پاسخ نهایی با استفاده از متد کمکی، بدون ایجاد deadlock
      // از `updatedUser` که همین الان داریم استفاده می‌کنیم
      return this._prepareResponseData(
        updatedUser,
        totalMiningRatePerHour,
        manager,
      );
    });
  }

  async claimRewards(userId: number) {
    return this.entityManager.transaction(async (manager) => {
      const { user: updatedUser } = await this._updateAndGetUserMiningStatus(
        userId,
        manager,
      );
      const toClaim = Number(updatedUser.unclaimedMiningReward);
      if (toClaim < 0.000001) {
        throw new BadRequestException('No sufficient rewards to claim.');
      }

      updatedUser.bricsBalance = Number(updatedUser.bricsBalance) + toClaim;
      updatedUser.unclaimedMiningReward = 0;
      await manager.save(updatedUser);
      return {
        newBricsBalance: updatedUser.bricsBalance,
        newBalance: updatedUser.balance,
        claimedAmount: toClaim,
      };
    });
  }

  async seedInitialData() {
    const hardwareCount = await this.hardwareRepository.count();
    if (hardwareCount > 0) {
      return { message: 'Database is already seeded.' };
    }

    // از entityManager برای اجرای عملیات در یک تراکنش استفاده می‌کنیم
    await this.entityManager.transaction(async (manager) => {
      const hardwareRepo = manager.getRepository(Hardware);
      const levelRepo = manager.getRepository(HardwareLevel);

      const cpu = hardwareRepo.create({
        name: 'Basic CPU',
        description: '...',
      });
      const gpu = hardwareRepo.create({
        name: 'Standard GPU',
        description: '...',
      });
      await hardwareRepo.save([cpu, gpu]);

      await levelRepo.save([
        {
          hardware: cpu,
          level: 1,
          miningRatePerHour: 0.0001,
          upgradeCost: 100,
        },
        {
          hardware: cpu,
          level: 2,
          miningRatePerHour: 0.00025,
          upgradeCost: 250,
        },
        { hardware: cpu, level: 3, miningRatePerHour: 0.0005, upgradeCost: 0 },
      ]);

      await levelRepo.save([
        {
          hardware: gpu,
          level: 1,
          miningRatePerHour: 0.002,
          upgradeCost: 1500,
        },
        {
          hardware: gpu,
          level: 2,
          miningRatePerHour: 0.0045,
          upgradeCost: 4000,
        },
        { hardware: gpu, level: 3, miningRatePerHour: 0.01, upgradeCost: 0 },
      ]);
    });

    return { message: 'Seeding completed successfully!' };
  }
}
