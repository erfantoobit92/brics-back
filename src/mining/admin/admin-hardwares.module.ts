import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminHardwaresController } from './admin-hardwares.controller';
import { AdminHardwaresService } from './admin-hardwares.service';
import { Hardware } from '../entities/hardware.entity';
import { HardwareLevel } from '../entities/hardware-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hardware, HardwareLevel])],
  controllers: [AdminHardwaresController],
  providers: [AdminHardwaresService],
})
export class AdminHardwaresModule {}