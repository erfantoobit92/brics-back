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
import { Hardware } from 'src/mining/entities/hardware.entity';
import { UserHardware } from 'src/mining/entities/user-hardware.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Hardware)
    private hardwareRepository: Repository<Hardware>,
    @InjectRepository(UserHardware)
    private userHardwareRepository: Repository<UserHardware>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const userData = await this.validateTelegramData(initData);

    const referrerTelegramId = startParam ? parseInt(startParam, 10) : null;

    let user = await this.usersRepository.findOne({
      where: { telegramId: userData.id },
    });

    if (user) {
      // اطلاعاتش رو با دیتای جدید تلگرام آپدیت کن
      user.firstName = userData.first_name;
      user.lastName = userData.last_name;
      user.username = userData.username;
      user.photoUrl = userData.photo_url; // photo_url از دیتای تلگرام میاد
      await this.usersRepository.save(user);
    }
    // اگر کاربر وجود نداشت (کاربر جدید)
    else {
      user = this.usersRepository.create({
        telegramId: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        photoUrl: userData.photo_url, // موقع ساختن هم عکس رو ذخیره کن
        balance: 5000,
        lastMiningInteraction: new Date(),
      });

      if (referrerTelegramId) {
        const referrer = await this.usersRepository.findOne({
          where: { telegramId: referrerTelegramId },
        });
        if (referrer && referrer.telegramId !== user.telegramId) {
          user.referrerId = referrer.id;
          const currentReferrerBalance = Number(referrer.balance);
          const bonus = Number(1000);
          referrer.balance = currentReferrerBalance + bonus;
          await this.usersRepository.save(referrer); // <--- از ریپازیتوری معمولی استفاده کن
        }
      }

      await this.usersRepository.save(user);

      const defaultHardware = await this.hardwareRepository.findOne({
        where: { id: 1 },
      });

      if (defaultHardware) {
        const newUserHardware = this.userHardwareRepository.create({
          user: user,
          hardware: defaultHardware,
          level: 1,
        });
        await this.userHardwareRepository.save(newUserHardware);
      } else {
        console.error('Default hardware with ID 1 not found!'); // لاگ برای خطا
      }

      console.log(`New user ${user.id} created.`);
    }

    const payload = { sub: user.id, telegramId: user.telegramId, role: 'user' };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async adminLogin(
    adminLoginDto: AdminLoginDto,
  ): Promise<{ access_token: string }> {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (
      adminLoginDto.username !== adminUsername ||
      adminLoginDto.password !== adminPassword
    ) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // We create a special JWT for the admin
    // The 'sub' can be a fixed ID, and we add a role for future checks
    const payload = {
      username: adminLoginDto.username,
      sub: 'admin-user-id', // A static identifier for the admin
      role: 'admin', // Very important for protecting admin routes later!
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
