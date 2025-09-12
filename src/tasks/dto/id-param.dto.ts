import { IsUUID } from 'class-validator';

export class IdParamsDto {
  @IsUUID()
  id: string;
}
