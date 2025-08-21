import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { MiningModule } from './mining/mining.module'; // << فقط این import میمونه
import { SettingsModule } from './settings/settings.module';
import { ExchangeModule } from './exchange/exchange.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // ماژول‌های برنامه شما در اینجا import می شوند
    AuthModule,
    UserModule,
    GameModule,
    SettingsModule, // <<-- حتما این ماژول را قبل از ExchangeModule ایمپورت کن
    MiningModule,
    ExchangeModule,
  ],
  // Controller و Provider های مربوط به mining از اینجا حذف می شوند!
  controllers: [],
  providers: [],
})
export class AppModule {}
