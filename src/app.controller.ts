import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

// یک DTO ساده برای دریافت لاگ‌ها
class LogDto {
  level: 'log' | 'warn' | 'error';
  message: string;
  data?: any; // برای ارسال آبجکت‌های اضافی
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // --- اندپوینت جدید برای لاگ‌گیری ---
  @Post('log')
  logFromClient(@Body() logDto: LogDto) {
    const { level, message, data } = logDto;
    
    // یک پیشوند اضافه می‌کنیم تا لاگ‌های فرانت‌اند مشخص باشن
    const prefix = '[FRONTEND LOG]'; 
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      default:
        console.log(logMessage, data || '');
        break;
    }
    
    // یک پاسخ ساده برمی‌گردونیم تا درخواست معلق نمونه
    return { status: 'logged' };
  }
}