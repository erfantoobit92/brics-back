import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env file');
    }
    this.bot = new Telegraf(botToken);
  }

  onModuleInit() {
    // You can launch the bot here if you need to listen for updates
    // For our case, we only need to make API calls, so no launch needed yet.
    this.logger.log('Telegraf bot initialized.');
  }

  /**
   * Checks if a user is a member of a specific channel.
   * @param channelId The channel's username (e.g., '@mychannel') or ID.
   * @param userId The numeric Telegram User ID.
   * @returns true if the user is a member, false otherwise.
   */
  async isUserMemberOfChannel(
    channelId: string | number,
    userId: number,
  ): Promise<boolean> {
    try {
      console.log('!!!!!channelId', channelId);
      console.log('!!!!!userId', userId);

      const member = await this.bot.telegram.getChatMember(channelId, userId);
      // User is considered a member if their status is one of these
      const validStatuses = ['creator', 'administrator', 'member'];
      return validStatuses.includes(member.status);
    } catch (error) {
      this.logger.error(
        `Failed to check chat member for user ${userId} in channel ${channelId}`,
        error.stack,
      );
      // The API throws an error if the user is not found, so we treat it as "not a member"
      return false;
    }
  }

  async hasUserBoostedChannel(
    channelId: string | number,
    userId: number,
  ): Promise<boolean> {
    try {
      
      const boosters = await this.bot.telegram.getUserChatBoosts(
        channelId,
        Number(userId),
      );

      if (
        boosters &&
        typeof boosters === 'object' &&
        'boosts' in boosters &&
        Array.isArray(boosters.boosts)
      ) {
        if (boosters.boosts.length > 0) {
          this.logger.log(`User ${userId} has boosted channel ${channelId}.`);
          return true;
        }
      }

      this.logger.warn(`User ${userId} has NOT boosted channel ${channelId}.`);
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to check channel boosters for user ${userId} in channel ${channelId}`,
        error.stack,
      );
      return false;
    }
  }
}
