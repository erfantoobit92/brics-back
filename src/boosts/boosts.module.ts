// src/boosts/boosts.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoostsService } from './boosts.service';
import { BoostsController as UserBoostsController } from './boosts.controller';
import { BoostsController as AdminBoostsController } from './admin/boosts.controller';

import { BoostLevel } from './boost-level.entity';
import { User } from '../user/user.entity';
import { AuthModule } from '../auth/auth.module'; // اگر گاردها بهش نیاز دارن

@Module({
  imports: [
    TypeOrmModule.forFeature([BoostLevel, User]),
    AuthModule, // برای دسترسی به JwtAuthGuard و ...
  ],
  controllers: [UserBoostsController, AdminBoostsController],
  providers: [BoostsService],
})
export class BoostsModule {}
