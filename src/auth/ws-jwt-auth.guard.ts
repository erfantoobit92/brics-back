import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = client.handshake.auth.token;

      if (!authToken) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(authToken);
      // اینجا payload رو به خود کلاینت سوکت اضافه میکنیم تا در Gateway بهش دسترسی داشته باشیم
      client['user'] = payload; 
      
      return true;
    } catch (err) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}