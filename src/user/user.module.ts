import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Task } from 'src/tasks/entities/task.entity';
import { UserTask } from 'src/tasks/entities/user-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Task, // <-- 3. Add Task here
      UserTask,
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [TypeOrmModule, UserService], // برای اینکه GameModule بتونه از User entity استفاده کنه
})
export class UserModule {}
