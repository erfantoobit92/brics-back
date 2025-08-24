import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from './user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { UserTask, UserTaskStatus } from 'src/tasks/entities/user-task.entity';
import { TaskType } from 'src/tasks/enum/task-type.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task) // <<<< اینجاست! index [1]
    private tasksRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private userTasksRepository: Repository<UserTask>,
    private dataSource: DataSource,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findReferrals(userId: number) {
    const userWithReferrals = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['referrals'], // این خط باعث میشه دوستانش هم لود بشن
    });

    if (!userWithReferrals) {
      throw new Error('User not found');
    }

    // فقط اطلاعات ضروری رو به فرانت می‌فرستیم
    return userWithReferrals.referrals.map((ref) => ({
      id: ref.id,
      firstName: ref.firstName,
      lastName: ref.firstName,
      username: ref.username,
    }));
  }

  async addBalance(userId: number, amount: number, queryRunner?: QueryRunner) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(user.balance);
    console.log(amount);
    
    user.balance = Number(user.balance) + Number(amount);

    if (queryRunner) {
      return queryRunner.manager.save(User, user);
    } else {
      return this.usersRepository.save(user);
    }
  }

  async handleWalletConnection(userId: number, walletAddress: string) {
    // Check if another user has already taken this wallet address
    const existingUserWithWallet = await this.usersRepository.findOneBy({
      walletAddress,
    });
    if (!existingUserWithWallet) {
      throw new BadRequestException('Wallet address already taken.');
    }
    if (existingUserWithWallet && existingUserWithWallet.id !== userId) {
      throw new BadRequestException(
        'This wallet address is already linked to another account.',
      );
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    if (user.walletAddress)
      throw new BadRequestException('Wallet already connected.');

    // Find the "Connect Wallet" task configuration from the tasks table
    const connectWalletTask = await this.tasksRepository.findOneBy({
      type: TaskType.CONNECT_WALLET,
      isActive: true,
    });

    if (!connectWalletTask) {
      // If there is no such task, just save the wallet and return
      user.walletAddress = walletAddress;
      await this.usersRepository.save(user);
      return { message: 'Wallet connected successfully.' };
    }

    // --- Start Transaction ---
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update user's wallet address
      user.walletAddress = walletAddress;
      await queryRunner.manager.save(user);

      // 2. Mark the "Connect Wallet" task as completed for this user
      const userTaskExists = await this.userTasksRepository.findOne({
        where: { user: { id: userId }, task: { id: connectWalletTask.id } },
      });

      // Only give reward if they haven't somehow completed it before
      if (!userTaskExists) {
        const newUserTask = this.userTasksRepository.create({
          user: user,
          task: connectWalletTask,
          status: UserTaskStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date(),
        });
        await queryRunner.manager.save(newUserTask);

        // 3. Add the reward to the user's balance
        await this.addBalance(
          userId,
          connectWalletTask.rewardCoin,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      const updatedUser = await this.findOne(userId);

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }
      return {
        message: 'Wallet connected and reward claimed!',
        newBalance: updatedUser.balance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Failed to connect wallet:', error);
      throw new BadRequestException(
        'An error occurred while connecting the wallet. Please try again.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
