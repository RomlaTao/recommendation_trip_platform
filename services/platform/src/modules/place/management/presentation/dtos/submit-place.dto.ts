import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SubmitPlaceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerId: string;
}
