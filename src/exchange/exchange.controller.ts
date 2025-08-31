import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ConvertDto } from './dto/convert.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Get('/status')
  getStatus(@Req() req) {
    return this.exchangeService.getExchangeStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('/convert')
  convert(@Req() req, @Body() convertDto: ConvertDto) {
    return this.exchangeService.convertCurrency(req.user.id, convertDto);
  }
}
