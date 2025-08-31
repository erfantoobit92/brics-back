import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiningController } from './mining.controller';
import { MiningService } from './mining.service';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/user.entity';
import { Hardware } from './entities/hardware.entity';
import { HardwareLevel } from './entities/hardware-level.entity';
import { UserHardware } from './entities/user-hardware.entity';
import { Task } from 'src/tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Hardware, HardwareLevel, UserHardware, Task]),
    AuthModule, 
  ],
  controllers: [MiningController],
  providers: [MiningService], 
})
export class MiningModule {}
