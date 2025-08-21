import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forFeature([User]), // سرویس بازی به ریپازیتوری یوزر نیاز داره
  ],
  providers: [GameGateway, GameService],
})
export class GameModule {}