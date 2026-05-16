import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RemoveTripItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tripDayId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  itemId: string;
}
