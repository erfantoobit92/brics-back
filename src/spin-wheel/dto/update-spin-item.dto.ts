// src/spin-wheel/dto/update-spin-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSpinItemDto } from './create-spin-item.dto';

export class UpdateSpinItemDto extends PartialType(CreateSpinItemDto) {}