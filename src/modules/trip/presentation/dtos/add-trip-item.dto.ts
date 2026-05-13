import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class AddTripItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  placeId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  type: string;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN)
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @Matches(TIME_PATTERN)
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;
}
