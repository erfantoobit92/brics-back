import { PartialType } from '@nestjs/mapped-types';
import { CreateHardwareLevelDto } from './create-hardware-level.dto';

export class UpdateHardwareLevelDto extends PartialType(CreateHardwareLevelDto) {}