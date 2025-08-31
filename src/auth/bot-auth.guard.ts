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
    console.log('--- BotAuthGuard Activated ---');
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-bot-secret'];
    console.log(`Received Secret from header [x-bot-secret]: "${secret}"`);
    const expectedSecret = this.configService.get<string>('BOT_SECRET');

    console.log('secret : ', secret);
    console.log('expectedSecret : ', expectedSecret);

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid secret for bot communication');
    }
    return true;
  }
}
