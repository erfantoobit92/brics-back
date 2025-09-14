// src/spin-wheel/spin-wheel.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpinWheelService } from './spin-wheel.service';
import { SpinWheelController as UserSpinWheelController } from './spin-wheel.controller';
import { SpinWheelController as AdminSpinWheelController } from './admin/spin-wheel.controller';
import { SpinWheelItem } from './entity/spin-wheel-item.entity';
import { User } from '../user/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpinWheelItem, User]),
    AuthModule,
  ],
  controllers: [UserSpinWheelController, AdminSpinWheelController],
  providers: [SpinWheelService],
})
export class SpinWheelModule {}