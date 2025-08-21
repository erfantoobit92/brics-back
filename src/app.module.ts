import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './user/user.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { MiningModule } from './mining/mining.module';
import { Hardware } from './mining/entities/hardware.entity';
import { HardwareLevel } from './mining/entities/hardware-level.entity';
import { UserHardware } from './mining/entities/user-hardware.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // این خط خیلی مهمه!
      envFilePath: '.env', // مسیر فایل .env
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
        entities: [User, Hardware, HardwareLevel, UserHardware], 
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    GameModule,
    MiningModule, // این خط هم باید بدون خطا کار کنه
  ],
})
export class AppModule {}