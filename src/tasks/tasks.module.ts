import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { UserTask } from './entities/user-task.entity';
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from '../telegram/telegram.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AdminTasksService } from './admin/admin-tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UserTask]),
    UserModule,
    TelegramModule,
    BlockchainModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, AdminTasksService],
})
export class TasksModule {}
