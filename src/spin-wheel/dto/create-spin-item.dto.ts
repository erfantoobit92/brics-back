// src/spin-wheel/dto/create-spin-item.dto.ts
import { IsString, IsEnum, IsNumber, Min, IsOptional, IsUrl, IsBoolean, MaxLength, IsPositive } from 'class-validator';
import { SpinRewardType } from '../entity/spin-wheel-item.entity';

export class CreateSpinItemDto {
  @IsString()
  @MaxLength(100)
  label: string;

  @IsEnum(SpinRewardType)
  type: SpinRewardType;

  @IsNumber()
  @Min(0)
  value: number;
  
  @IsNumber()
  @IsPositive()
  weight: number;

  @IsBoolean()
  isActive: boolean;
}