import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateTripItemDto {
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

export class CreateTripDayDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayIndex: number;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [CreateTripItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripItemDto)
  items: CreateTripItemDto[];
}

export class CreateTripDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ type: [CreateTripDayDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTripDayDto)
  days: CreateTripDayDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sourceSnapshotId?: string;
}
