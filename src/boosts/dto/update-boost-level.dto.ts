// src/boosts/dto/update-boost-level.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBoostLevelDto } from './create-boost-level.dto';

export class UpdateBoostLevelDto extends PartialType(CreateBoostLevelDto) {}