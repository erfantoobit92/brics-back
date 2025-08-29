import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from './decorators/public.decorator';

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
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.initData, loginDto.startParam);
  }

  @Public() // <-- اینجا ازش استفاده کن!
  @Post('admin/login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.adminLogin(adminLoginDto);
  }
}
