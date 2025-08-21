import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateTelegramData(initData: string): Promise<any> {
    // 1. اول توکن ربات رو بگیر
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 2. چک کن که توکن وجود داره یا نه. اگر نه، یعنی سرور درست کانفیگ نشده
    if (!botToken) {
      console.error(
        'Fatal Error: TELEGRAM_BOT_TOKEN is not defined in environment variables.',
      );
      // این یک خطای سمت سروره، نه خطای کاربر
      throw new InternalServerErrorException('Server configuration error.');
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const userParam = urlParams.get('user');

    if (!hash || !userParam) {
      throw new UnauthorizedException(
        'Invalid Telegram data: Missing hash or user data',
      );
    }

    urlParams.delete('hash');
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // 3. حالا با خیال راحت از متغیر botToken که مطمئنیم string هست استفاده کن
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram data: Hash mismatch');
    }

    try {
      const userData = JSON.parse(userParam);
      return userData;
    } catch (e) {
      throw new UnauthorizedException(
        'Invalid Telegram data: Malformed user JSON',
      );
    }
  }

  async login(initData: string, startParam?: string) {
    console.log('ssssssssssss :  ', initData);
    console.log('ssssssssssss :  ', startParam);

    const userData = await this.validateTelegramData(initData);

    const referrerTelegramId = startParam ? parseInt(startParam, 10) : null;

    let user = await this.usersRepository.findOne({
      where: { telegramId: userData.id },
    });

    if (user) {
      // اطلاعاتش رو با دیتای جدید تلگرام آپدیت کن
      user.firstName = userData.first_name;
      user.username = userData.username;
      user.photoUrl = userData.photo_url; // photo_url از دیتای تلگرام میاد
      await this.usersRepository.save(user);
      console.log(`User ${user.id} data updated.`);
    }
    // اگر کاربر وجود نداشت (کاربر جدید)
    else {
      user = this.usersRepository.create({
        telegramId: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        photoUrl: userData.photo_url, // موقع ساختن هم عکس رو ذخیره کن
        balance: '5000', // <--- به string تغییرش بده
      });

      if (referrerTelegramId) {
        const referrer = await this.usersRepository.findOne({
          where: { telegramId: referrerTelegramId },
        });
        if (referrer && referrer.telegramId !== user.telegramId) {
          user.referrerId = referrer.id;
          const currentReferrerBalance = BigInt(referrer.balance);
          const bonus = BigInt(1000);
          referrer.balance = (currentReferrerBalance + bonus).toString();
          await this.usersRepository.save(referrer); // <--- از ریپازیتوری معمولی استفاده کن
        }
      }

      await this.usersRepository.save(user);
      console.log(`New user ${user.id} created.`);
    }

    const payload = { sub: user.id, telegramId: user.telegramId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
