import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CompleteStoryTaskDto {
  @IsNumber()
  @IsNotEmpty()
  telegramId: number;
}