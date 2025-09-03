import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-bot-secret'];
    const expectedSecret = this.configService.get<string>('BOT_SECRET');

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid secret for bot communication');
    }
    return true;
  }
}
