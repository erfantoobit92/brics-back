import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { DeepPartial } from 'typeorm';

export class TranslatableStringDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  fa: string;

  @IsString()
  @IsNotEmpty()
  ar: string;

  @IsString()
  @IsNotEmpty()
  zh: string;

  
  @IsString()
  @IsNotEmpty()
  ru: string;

  
  @IsString()
  @IsNotEmpty()
  hi: string;
}

export class CreateHardwareDto {
  @ValidateNested()
  @Type(() => TranslatableStringDto)
  name: TranslatableStringDto;

  @ValidateNested()
  @Type(() => TranslatableStringDto)
  description?: TranslatableStringDto;
}
