// src/game/game.module.ts

import { Module } from '@nestjs/common';
// GameGateway رو حذف کن
import { GameService } from './game.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { GameController } from './game.controller'; // اینو اضافه کن

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forFeature([User]),
  ],
  // GameGateway رو از اینجا حذف کن
  providers: [GameService],
  controllers: [GameController], // کنترلر رو اینجا اضافه کن
})
export class GameModule {}