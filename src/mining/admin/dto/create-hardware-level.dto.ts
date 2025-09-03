import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer'; // برای تبدیل اتوماتیک

export class CreateHardwareLevelDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  level: number;

  @IsNumber({}, { message: 'میزان ماین باید یک عدد باشد' })
  @Min(0)
  @Type(() => Number) // مهم برای تبدیل رشته به عدد
  @IsNotEmpty()
  miningRatePerHour: number;

  @IsNumber({}, { message: 'هزینه ارتقا باید یک عدد باشد' })
  @Min(0)
  @Type(() => Number) // مهم برای تبدیل رشته به عدد
  @IsNotEmpty()
  upgradeCost: number;
}