import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DeleteOwnPlaceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerId: string;
}
