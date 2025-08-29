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
import { TaskType } from 'src/tasks/enum/task-type.enum';
import { Task } from 'src/tasks/entities/task.entity';

const MAX_OFFLINE_MINING_HOURS = 2;
const MAX_OFFLINE_MINING_SECONDS = MAX_OFFLINE_MINING_HOURS * 3600;

@Injectable()
export class MiningService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Hardware)
    private readonly  hardwareRepository: Repository<Hardware>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
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

          //   if (currentLevel > 0) {
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
          //   } else {

          //   }
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
            buyCost: firstLevelInfo ? Number(firstLevelInfo.upgradeCost) : null, // هزینه خرید در واقع هزینه آپگرید از سطح ۰ به ۱ است
            isMaxLevel: false,
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

      updatedUser.balance = Number(updatedUser.balance) - upgradeCost;
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

  async buyHardware(userId: number, hardwareId: number) {
    return this.entityManager.transaction(async (manager) => {
      // ۱. کاربر و سخت‌افزاری که می‌خواهد بخرد را پیدا می‌کنیم
      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ['hardwares', 'hardwares.hardware'],
      });
      const hardwareToBuy = await manager.findOne(Hardware, {
        where: { id: hardwareId },
      });

      if (!user) throw new NotFoundException('User not found.');
      if (!hardwareToBuy) throw new NotFoundException('Hardware not found.');

      // ۲. چک می‌کنیم که کاربر از قبل این سخت‌افزار را نداشته باشد
      const alreadyOwned = user.hardwares.some(
        (uh) => uh.hardware.id === hardwareId,
      );
      if (alreadyOwned) {
        throw new BadRequestException('You already own this hardware.');
      }

      // ۳. هزینه خرید (هزینه سطح ۱) را پیدا می‌کنیم
      const hardwareLevelRepository = manager.getRepository(HardwareLevel);
      const firstLevelInfo = await hardwareLevelRepository.findOne({
        where: { hardware: { id: hardwareId }, level: 1 },
      });

      if (!firstLevelInfo || !firstLevelInfo.upgradeCost) {
        throw new BadRequestException('This hardware is not purchasable.');
      }
      const buyCost = Number(firstLevelInfo.upgradeCost);

      // ۴. چک کردن موجودی کاربر
      if (Number(user.balance) < buyCost) {
        throw new BadRequestException(
          'Insufficient balance to buy this hardware.',
        );
      }

      // ۵. کسر هزینه و اضافه کردن سخت‌افزار جدید به کاربر
      user.balance = Number(user.balance) - buyCost;

      const newUserHardware = manager.create(UserHardware, {
        user: user,
        hardware: hardwareToBuy,
        level: 1,
      });

      await manager.save([user, newUserHardware]);

      // برای اینکه response نهایی سخت‌افزار جدید رو هم شامل بشه، کاربر رو با رابطه جدید refetch میکنیم
      const updatedUser = await manager.findOne(User, {
        where: { id: userId },
        relations: ['hardwares', 'hardwares.hardware'],
      });

      if (!updatedUser) {
        // این اتفاق در عمل نباید بیفتد چون کاربر را همین الان آپدیت کردیم،
        // اما این بررسی کد را بسیار امن‌تر می‌کند.
        throw new NotFoundException('Failed to refetch user after purchase.');
      }

      const totalMiningRateAfterPurchase = await this.calculateTotalRate(
        updatedUser,
        manager,
      );

      // ۶. برگرداندن وضعیت کامل و به‌روز شده
      return this._prepareResponseData(
        updatedUser,
        totalMiningRateAfterPurchase,
        manager,
      );
    });
  }

  private async calculateTotalRate(
    user: User,
    manager: EntityManager,
  ): Promise<number> {
    if (!user.hardwares || user.hardwares.length === 0) {
      return 0;
    }

    const hardwareLevelRepository = manager.getRepository(HardwareLevel);
    let totalRate = 0;

    const levels = await Promise.all(
      user.hardwares.map((uh) =>
        hardwareLevelRepository.findOne({
          where: { hardware: { id: uh.hardware.id }, level: uh.level },
        }),
      ),
    );

    levels.forEach((levelInfo) => {
      if (levelInfo) totalRate += Number(levelInfo.miningRatePerHour);
    });

    return totalRate;
  }

async seedInitialData() {
  const hardwareCount = await this.hardwareRepository.count();
  const taskCount = await this.taskRepository.count();

  if (hardwareCount > 0 && taskCount > 0) {
    return { message: 'Database is already seeded.' };
  }

  await this.entityManager.transaction(async (manager) => {
    const hardwareRepo = manager.getRepository(Hardware);
    const levelRepo = manager.getRepository(HardwareLevel);
    const taskRepo = manager.getRepository(Task);

    // ================= Hardware =================
    const cpu = hardwareRepo.create({
      name: 'Basic CPU',
      description: 'A simple processor for beginner miners.',
    });
    const gpu = hardwareRepo.create({
      name: 'Standard GPU',
      description: 'A mid-range GPU capable of decent mining speed.',
    });
    const ram = hardwareRepo.create({
      name: 'DDR5 RAM',
      description: 'High-speed RAM that optimizes mining computations.',
    });
    const ssd = hardwareRepo.create({
      name: 'NVMe SSD',
      description: 'Ultra-fast SSD that reduces latency and boosts efficiency.',
    });
    const quantumChip = hardwareRepo.create({
      name: 'Quantum Chip',
      description: 'Next-gen hardware with insane mining capability 🚀',
    });

    await hardwareRepo.save([cpu, gpu, ram, ssd, quantumChip]);

    // Levels
    await levelRepo.save([
      { hardware: cpu, level: 1, miningRatePerHour: 0.0001, upgradeCost: 100 },
      { hardware: cpu, level: 2, miningRatePerHour: 0.00025, upgradeCost: 250 },
      { hardware: cpu, level: 3, miningRatePerHour: 0.0005, upgradeCost: 0 },

      { hardware: gpu, level: 1, miningRatePerHour: 0.002, upgradeCost: 1500 },
      { hardware: gpu, level: 2, miningRatePerHour: 0.0045, upgradeCost: 4000 },
      { hardware: gpu, level: 3, miningRatePerHour: 0.01, upgradeCost: 0 },

      { hardware: ram, level: 1, miningRatePerHour: 0.0005, upgradeCost: 800 },
      { hardware: ram, level: 2, miningRatePerHour: 0.0012, upgradeCost: 2000 },
      { hardware: ram, level: 3, miningRatePerHour: 0.0025, upgradeCost: 0 },

      { hardware: ssd, level: 1, miningRatePerHour: 0.001, upgradeCost: 1200 },
      { hardware: ssd, level: 2, miningRatePerHour: 0.0025, upgradeCost: 3500 },
      { hardware: ssd, level: 3, miningRatePerHour: 0.005, upgradeCost: 0 },

      { hardware: quantumChip, level: 1, miningRatePerHour: 0.02, upgradeCost: 50000 },
      { hardware: quantumChip, level: 2, miningRatePerHour: 0.05, upgradeCost: 150000 },
      { hardware: quantumChip, level: 3, miningRatePerHour: 0.1, upgradeCost: 0 },
    ]);

    // ================= Tasks =================
    const tasksData = [
      {
        title: 'Visit Our Official Website',
        description: 'Spend at least 60 seconds on our website to learn more about the project.',
        rewardCoin: 1000,
        type: TaskType.VISIT_WEBSITE,
        metadata: { url: 'https://www.bricstrade.net/en', durationSeconds: 60 },
      },
      {
        title: 'Follow Us on X (Twitter)',
        description: 'Stay updated with our latest news and announcements on X.',
        rewardCoin: 2000,
        type: TaskType.FOLLOW_SOCIAL,
        metadata: { url: 'https://x.com/your_profile', durationSeconds: 60 },
      },
      {
        title: 'Follow Us on Instagram',
        description: 'Follow Instagram Page And Get Reward.',
        rewardCoin: 2000,
        type: TaskType.FOLLOW_SOCIAL,
        metadata: { url: 'https://instagram.com/erfun_hasanzde', durationSeconds: 60 },
      },
      {
        title: 'Watch Our Tutorial on YouTube',
        description: 'Watch our 5-minute tutorial to understand all the features.',
        rewardCoin: 3000,
        type: TaskType.WATCH_YOUTUBE,
        metadata: { url: 'https://youtube.com/watch?v=your_video_id', durationSeconds: 300 },
      },
      {
        title: 'Join Our Telegram Channel',
        description: 'Be part of our community and get exclusive updates.',
        rewardCoin: 2500,
        type: TaskType.JOIN_TELEGRAM_CHANNEL,
        metadata: { channelId: '@bricsnews' },
      },
      {
        title: 'Add Our Logo to Your Name',
        description: 'Add our official logo 🧱 to your Telegram name to show your support!',
        rewardCoin: 5000,
        type: TaskType.ADD_LOGO_TO_PROFILE_NAME,
        metadata: { logo: '🧱' },
      },
      {
        title: 'Connect Your TON Wallet',
        description: 'Connect your wallet to enable advanced features and future airdrops.',
        rewardCoin: 15000,
        type: TaskType.CONNECT_WALLET,
        metadata: {},
      },
      {
        title: 'Make a 0.2 TON Transaction',
        description: 'Support the project by sending 0.2 TON to our community wallet.',
        rewardCoin: 10000,
        type: TaskType.ON_CHAIN_TRANSACTION,
        metadata: { network: 'TON', amount: 0.2, toAddress: 'UQAflnSGskn-9u1WfKzQKQvlj6B2Gg9P23_Bup7Li3JWnUG3' },
      },
      {
        title: 'Boost Our Telegram Channel',
        description: 'Support our community with your Telegram Premium boost and earn a huge reward!',
        rewardCoin: 25000,
        type: TaskType.BOOST_TELEGRAM_CHANNEL,
        metadata: { channelUrl: 'https://t.me/bricsnews?boost', durationSeconds: 180 },
      },
      {
        title: 'Add Our Token to Your Wallet',
        description: 'Make our token official in your wallet to easily track its value.',
        rewardCoin: 5000,
        type: TaskType.ADD_TOKEN_TO_WALLET,
        metadata: {
          networkName: 'TON Mainnet',
          tokenAddress: '0x278a5B50c34506bc8e15C8567136292c30C92CD1',
          tokenSymbol: 'Brics Trade (Bct)',
          tokenDecimals: 9,
          durationSeconds: 90,
        },
      },
      {
        title: 'Post a Story About Us',
        description: 'Share our app with your friends in a Telegram story.',
        rewardCoin: 7000,
        type: TaskType.POST_TELEGRAM_STORY,
        metadata: { durationSeconds: 120 },
      },
    ];

    for (const taskData of tasksData) {
      const existing = await taskRepo.findOne({ where: { title: taskData.title } });
      if (!existing) {
        await taskRepo.save(taskRepo.create(taskData));
      }
    }
  });

  return { message: 'Seeding completed successfully!' };
}

}
