import { IsEnum, IsNumber, IsPositive, Min } from 'class-validator';

// تعریف جهت تبدیل ارز برای خوانایی بیشتر کد
export enum ConversionDirection {
  BALANCE_TO_BRICS = 'BALANCE_TO_BRICS', // کاربر بالانس می‌دهد و بریکس می‌گیرد
  BRICS_TO_BALANCE = 'BRICS_TO_BALANCE', // کاربر بریکس می‌دهد و بالانس می‌گیرد
}

export class ConvertDto {
  @IsNumber({ maxDecimalPlaces: 6 }) // اجازه ۶ رقم اعشار برای مقادیر Brics
  @IsPositive()
  @Min(0.000001) // حداقل مقدار قابل تبدیل
  amount: number;

  @IsEnum(ConversionDirection, { message: 'Direction must be either BALANCE_TO_BRICS or BRICS_TO_BALANCE' })
  direction: ConversionDirection;
}