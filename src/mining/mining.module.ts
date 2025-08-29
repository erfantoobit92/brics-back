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

// تمام Entity هایی که در MiningService استفاده می شوند را import کن

@Module({
  imports: [
    // <<---  این خط حیاتی است!  --- >>
    // به NestJS می گوید که Repository های این Entity ها را برای این ماژول فراهم کند
    TypeOrmModule.forFeature([User, Hardware, HardwareLevel, UserHardware, Task]),
    AuthModule, // برای استفاده از JwtAuthGuard
  ],
  controllers: [MiningController], // << کنترلر متعلق به این ماژول است
  providers: [MiningService], // << سرویس متعلق به این ماژول است
})
export class MiningModule {}
