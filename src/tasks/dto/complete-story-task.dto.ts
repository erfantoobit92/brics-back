import { IsNumber, IsNotEmpty } from 'class-validator';

export class CompleteStoryTaskDto {
  @IsNumber()
  @IsNotEmpty()
  telegramId: number;
}