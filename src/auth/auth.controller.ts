import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

// یک DTO (Data Transfer Object) برای ورودی تعریف می‌کنیم
class LoginDto {
  initData: string;
  startParam?: string; // startParam اختیاریه
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  // حالا به جای یک رشته، یک آبجکت DTO دریافت می‌کنیم
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.initData, loginDto.startParam);
  }
}