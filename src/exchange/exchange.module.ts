import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ExchangeController } from './exchange.controller';
// SettingsModule نیازی به ایمپورت نداره چون Global هست

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService],
})
export class ExchangeModule {}