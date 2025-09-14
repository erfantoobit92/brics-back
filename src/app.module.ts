import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { MiningModule } from './mining/mining.module';
import { SettingsModule } from './settings/settings.module';
import { ExchangeModule } from './exchange/exchange.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminHardwaresModule } from './mining/admin/admin-hardwares.module';
import { AdminSettingsModule } from './settings/admin/admin-settings.module';
import { StatsModule } from './stats/stats.module';
import { BoostsModule } from './boosts/boosts.module';
import { SpinWheelModule } from './spin-wheel/spin-wheel.module';

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

    AuthModule,
    UserModule,
    GameModule,
    SettingsModule,
    MiningModule,
    AdminHardwaresModule,
    ExchangeModule,
    AdminSettingsModule,
    TasksModule,
    StatsModule,
    BoostsModule,
    SpinWheelModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
