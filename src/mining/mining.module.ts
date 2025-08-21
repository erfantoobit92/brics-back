import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hardware } from './entities/hardware.entity';
import { HardwareLevel } from './entities/hardware-level.entity';
import { UserHardware } from './entities/user-hardware.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hardware, HardwareLevel, UserHardware, User])], // User رو اضافه کن
  controllers: [MiningController],
  providers: [MiningService],
})
export class MiningModule {}