import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { TranslatableStringDto } from 'src/mining/admin/dto/create-hardware.dto';
import { TaskType } from 'src/tasks/enum/task-type.enum';

export class CreateTaskDto {
  @ValidateNested()
  @Type(() => TranslatableStringDto)
  title: TranslatableStringDto;

  @ValidateNested()
  @Type(() => TranslatableStringDto)
  description?: TranslatableStringDto;

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
