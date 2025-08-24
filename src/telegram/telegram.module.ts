import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Module({
  imports: [ConfigModule], // To read BOT_TOKEN from .env
  providers: [TelegramService],
  exports: [TelegramService], // Export it to be used in TasksModule
})
export class TelegramModule {}