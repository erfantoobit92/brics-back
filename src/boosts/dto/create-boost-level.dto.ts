// src/boosts/dto/create-boost-level.dto.ts
import { IsInt, Min, IsPositive } from 'class-validator';

export class CreateBoostLevelDto {
  @IsInt()
  @Min(1, { message: 'Level must be at least 1' })
  level: number;

  @IsInt()
  @IsPositive({ message: 'Cost must be a positive number' })
  cost: number;
}