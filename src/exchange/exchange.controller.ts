import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ConvertDto } from './dto/convert.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // محافظت از تمام روت‌های این کنترلر با استراتژی JWT
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Endpoint برای دریافت وضعیت موجودی‌ها و نرخ تبدیل فعلی
   */
  @Get('/status')
  getStatus(@Req() req) {
    // req.user.id از JwtStrategy میاد که قبلاً درستش کردیم
    return this.exchangeService.getExchangeStatus(req.user.id);
  }

  /**
   * Endpoint برای انجام عملیات تبدیل ارز
   */
  @Post('/convert')
  convert(
    @Req() req,
    // ValidationPipe تضمین می‌کنه که body درخواست با ساختار ConvertDto مطابقت داره
    @Body() convertDto: ConvertDto,
  ) {
    return this.exchangeService.convertCurrency(req.user.id, convertDto);
  }
}
