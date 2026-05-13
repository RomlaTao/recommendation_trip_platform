import { PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreatePlaceDto } from './create-place.dto.js';

export class UpdatePlaceDto extends PartialType(CreatePlaceDto) {
  @IsUUID()
  partnerId: string;
}
