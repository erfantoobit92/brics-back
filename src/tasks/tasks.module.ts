import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { UserTask } from './entities/user-task.entity';
import { UserModule } from 'src/user/user.module';
import { TelegramModule } from '../telegram/telegram.module'; // Import TelegramModule
import { BlockchainModule } from '../blockchain/blockchain.module'; // <-- 1. Import the new module

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UserTask]),
    UserModule, // Import UsersModule to use UsersService
    TelegramModule, // Add it here
    BlockchainModule, // <-- 2. Add it to the imports array
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
