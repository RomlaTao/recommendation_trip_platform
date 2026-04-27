import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class RescheduleTripItemDto {
  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN)
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @Matches(TIME_PATTERN)
  endTime: string;
}
