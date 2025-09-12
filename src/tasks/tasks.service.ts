import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { UserTask, UserTaskStatus } from './entities/user-task.entity';
import { UserService } from 'src/user/user.service';
import { TaskType } from './enum/task-type.enum';
import { TonBlockchainService } from '../blockchain/ton.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    private readonly usersService: UserService,
    private readonly telegramService: TelegramService,
    private readonly tonBlockchainService: TonBlockchainService,
    private readonly dataSource: DataSource,
  ) {}

  async getTasksForUser(userId: number) {
    const tasks = await this.taskRepository.find({ where: { isActive: true } });
    const userTasks = await this.userTaskRepository.find({
      where: { user: { id: userId } },
      relations: ['task'],
    });

    // Create a map for quick lookup
    const userTaskMap = new Map(userTasks.map((ut) => [ut.task.id, ut.status]));

    return tasks.map((task) => ({
      ...task,
      status: userTaskMap.get(task.id) || UserTaskStatus.PENDING,
    }));
  }

  async startTask(userId: number, taskId: string) {
    const task = await this.taskRepository.findOneBy({ id: taskId });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    let userTask = await this.userTaskRepository.findOne({
      where: { user: { id: userId }, task: { id: taskId } },
    });

    if (userTask && userTask.status !== UserTaskStatus.PENDING) {
      throw new BadRequestException('Task already started or completed');
    }

    if (!userTask) {
      const userReference = new User();
      userReference.id = userId;

      const taskReference = new Task();
      taskReference.id = taskId;

      userTask = this.userTaskRepository.create({
        user: userReference,
        task: taskReference,
      });
    }

    userTask.status = UserTaskStatus.STARTED;
    userTask.startedAt = new Date();
    await this.userTaskRepository.save(userTask);

    return { message: 'Task started successfully', userTask };
  }

  async claimReward(userId: number, taskId: string): Promise<any> {
    const task = await this.taskRepository.findOneBy({ id: taskId });
    if (!task) {
      throw new NotFoundException('Task configuration not found.');
    }

    const directClaimTypes = [
      TaskType.ADD_LOGO_TO_PROFILE_NAME,
      TaskType.JOIN_TELEGRAM_CHANNEL,
    ];

    let userTask = await this.userTaskRepository.findOne({
      where: { user: { id: userId }, task: { id: taskId } },
      relations: ['task', 'user'], 
    });

    if (!userTask) {
      const userReference = new User();
      userReference.id = userId;
      userTask = this.userTaskRepository.create({
        user: userReference,
        task: task,
        status: UserTaskStatus.PENDING,
      });
    }

    if (userTask.status === UserTaskStatus.COMPLETED) {
      throw new BadRequestException('Reward already claimed');
    }

    if (
      !directClaimTypes.includes(task.type) &&
      userTask.status !== UserTaskStatus.STARTED
    ) {
      throw new BadRequestException('This task must be started first.');
    }

    if (
      directClaimTypes.includes(task.type) &&
      userTask.status === UserTaskStatus.FAILED
    ) {
      throw new BadRequestException(
        'Task Type Failed. Please start the task first.',
      );
    }

    const user = await this.usersService.findOne(userId); // Fetch full user details
    if (!user) {
      throw new NotFoundException('User not found for claim process.');
    }
    userTask.user = user; // Attach full user object to userTask

    let isCompleted = false;

    switch (task.type) {
      case TaskType.VISIT_WEBSITE:
      case TaskType.FOLLOW_SOCIAL:
      case TaskType.WATCH_YOUTUBE:
      case TaskType.ADD_TOKEN_TO_WALLET:
        isCompleted = this.validateTimerBasedTask(userTask, task);
        break;

      case TaskType.JOIN_TELEGRAM_CHANNEL:
        if (!user.telegramId)
          throw new BadRequestException('User Telegram ID not found.');
        isCompleted = await this.telegramService.isUserMemberOfChannel(
          task.metadata.channelId, // e.g., '@my_channel'
          user.telegramId,
        );
        break;

      case TaskType.ON_CHAIN_TRANSACTION:
        if (!user.walletAddress)
          throw new BadRequestException('User wallet address not connected.');

        isCompleted = await this.tonBlockchainService.verifyTonTransaction(
          task.metadata.toAddress,
          user.walletAddress,
          task.metadata.amount,
        );
        break;

      case TaskType.ADD_LOGO_TO_PROFILE_NAME:
        const requiredLogo = task.metadata?.logo;
        if (!requiredLogo) {
          throw new BadRequestException(
            'Task is not configured correctly. Logo is missing.',
          );
        }
        isCompleted = this.validateProfileNameLogo(user, requiredLogo);
        if (!isCompleted) {
          throw new BadRequestException(
            `Your Telegram name does not include the required logo: ${requiredLogo}`,
          );
        }
        break;

      case TaskType.BOOST_TELEGRAM_CHANNEL:
        if (!user.telegramId) {
          throw new BadRequestException('User Telegram ID not found.');
        }
        isCompleted = await this.telegramService.hasUserBoostedChannel(
          task.metadata.channelId,
          user.telegramId,
        );
        if (!isCompleted) {
          throw new BadRequestException(
            'You have not boosted our channel yet.',
          );
        }
        break;
      case TaskType.CONNECT_WALLET:
        throw new BadRequestException(
          'This task is completed automatically when you connect your wallet, not via the claim button.',
        );

      default:
        throw new BadRequestException(
          'Unknown or not-yet-implemented task type',
        );
    }

    if (!isCompleted) {
      throw new BadRequestException('Task requirement not met');
    }

    // If validation passes, give the reward inside a transaction
    return this.completeTaskTransaction(userTask, task);
  }

  private validateProfileNameLogo(user: User, requiredLogo: string): boolean {
    if (!requiredLogo) {
      console.error('Required logo is not defined in task metadata.');
      return false;
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`;

    // This check is simple but effective. It sees if the requiredLogo string
    // exists anywhere in the user's full name.
    return fullName.includes(requiredLogo);
  }

  // --- Validation Helper Methods ---

  private validateTimerBasedTask(userTask: UserTask, task: Task): boolean {
    // No default duration here, it MUST come from metadata.
    const durationSeconds = task.metadata?.durationSeconds;
    if (durationSeconds === undefined) {
      console.error(
        `Task ${task.id} is timer-based but has no durationSeconds in metadata.`,
      );
      // Return false because the task is misconfigured.
      return false;
    }
    const timeElapsed =
      (new Date().getTime() - userTask.startedAt.getTime()) / 1000;
    return timeElapsed >= durationSeconds;
  }

  private async completeTaskTransaction(userTask: UserTask, task: Task) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update userTask status
      userTask.status = UserTaskStatus.COMPLETED;
      userTask.completedAt = new Date();
      await queryRunner.manager.save(userTask);

      // 2. Update user balance
      await this.usersService.addBalance(
        userTask.user.id,
        task.rewardCoin,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Reward claimed successfully!',
        newBalance:
          (await this.usersService.findOne(userTask.user.id))?.balance ?? 0, // return new balance
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        'Failed to claim reward. Please try again.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async handleStoryForwarded(telegramId: number) {

    // 2. Find user by telegramId
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new NotFoundException(
        `User with telegramId ${telegramId} not found.`,
      );
    }

    // 4. Find the specific "Post Story" task
    const task = await this.taskRepository.findOneBy({
      type: TaskType.POST_TELEGRAM_STORY,
    });

    if (!task) {
      console.warn(`Active story task not found.`);
      throw new NotFoundException(`Active story task not found.`);
    }

    // 5. Check if the user has already completed this task
    let userTask = await this.userTaskRepository.findOneBy({
      user: { id: user.id },
      task: { id: task.id },
    });

    if (userTask && userTask.status === UserTaskStatus.COMPLETED) {
      // به ربات یک پیام موفقیت‌آمیز برمی‌گردونیم تا کاربر گیج نشه
      return { message: 'Task already completed.' };
    }

    // If the userTask doesn't exist, create it
    if (!userTask) {
      userTask = this.userTaskRepository.create({
        user: { id: user.id },
        task: { id: task.id },
        status: UserTaskStatus.PENDING, // Initial status
      });
    }

    userTask.user = user;

    const result = await this.completeTaskTransaction(userTask, task);

    return {
      message: 'Reward granted successfully.',
      newBalance: result.newBalance,
    };
  }
}
