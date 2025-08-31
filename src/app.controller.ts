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

}