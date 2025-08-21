import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';
import { JwtService } from '@nestjs/jwt'; // <--- این رو اضافه کن

// گارد رو اینجا نگه می‌داریم تا از هندلرهای پیام مثل 'tap' محافظت کنه
@UseGuards(WsJwtAuthGuard) 
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // JwtService رو اینجا تزریق می‌کنیم
  constructor(
    private readonly gameService: GameService,
    private readonly jwtService: JwtService,
  ) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // این متد وقتی یک کاربر جدید وصل میشه، اجرا میشه
  async handleConnection(client: Socket) {
    try {
      // 1. توکن رو از handshake کلاینت می‌خونیم
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }

      // 2. توکن رو با JwtService ولیدیت می‌کنیم
      const payload = await this.jwtService.verifyAsync(token);

      // 3. اگر توکن معتبر بود، payload رو به آبجکت کلاینت اضافه می‌کنیم
      //    تا در بقیه جاها (مثل handleTap) هم در دسترس باشه
      client['user'] = payload;
      
      console.log(`Client connected: ${client.id}, UserID: ${payload.sub}`);

      // 4. حالا با خیال راحت از userId استفاده می‌کنیم
      const userId = payload.sub;
      const initialState = await this.gameService.getUserState(userId);
      
      client.emit('initial_state', initialState);

    } catch (error) {
      // اگر توکن نامعتبر بود یا هر خطای دیگه‌ای رخ داد
      console.error(`Authentication failed for client ${client.id}:`, error.message);
      // اتصال کلاینت نامعتبر رو فوراً قطع می‌کنیم
      client.disconnect(true);
    }
  }

  @SubscribeMessage('tap')
  async handleTap(
    @MessageBody() data: { count: number },
    @ConnectedSocket() client: Socket,
  ) {
    // اینجا چون گارد @UseGuards رو نگه داشتیم، باز هم می‌تونیم به client.user دسترسی داشته باشیم
    const userId = client['user'].sub;
    const result = await this.gameService.processTap(userId, data.count);

    client.emit('update_state', result);
  }
}