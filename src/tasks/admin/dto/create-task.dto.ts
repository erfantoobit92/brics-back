import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { TaskType } from 'src/tasks/enum/task-type.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  rewardCoin: number;

  @IsEnum(TaskType)
  @IsNotEmpty()
  type: TaskType;

  @IsObject()
  @IsNotEmpty()
  metadata: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}