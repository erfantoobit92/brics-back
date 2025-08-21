import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity'; // یا هر مسیری که User entity هست
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 1. Entity های جدیدی که AuthService نیاز دارد را import کن
import { Hardware } from '../mining/entities/hardware.entity';
import { UserHardware } from '../mining/entities/user-hardware.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 2. آنها را در forFeature ثبت کن
    TypeOrmModule.forFeature([
      User, 
      Hardware,       // <<-- این اضافه شد
      UserHardware    // <<-- این اضافه شد
    ]),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' }, //
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule], // اگر جای دیگری از AuthService استفاده میکنید
})
export class AuthModule {}