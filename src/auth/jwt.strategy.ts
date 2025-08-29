import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // 1. کلید رو از ConfigService بگیر
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // 2. چک کن که مقدار وجود داشته باشه. اگه نبود، برنامه رو متوقف کن
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not defined in the environment variables!',
      );
    }

    // 3. حالا با خیال راحت ازش استفاده کن
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // اینجا دیگه مطمئنیم که jwtSecret یک string هست
    });
  }

  async validate(payload: any) {
    console.log('--- JWT Strategy Validate Called ---'); // <-- یک لاگ اینجا بذار
    console.log('Payload from token:', payload); // <-- ببینیم payload چیست

    return {
      sub: payload.sub,
      telegramId: payload.telegramId,
      role: payload.role,
    };
  }
}
