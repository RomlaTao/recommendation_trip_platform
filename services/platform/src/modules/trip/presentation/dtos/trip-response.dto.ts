import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripStatus } from '../../domain/enums/trip-status.enum.js';
import { TripRouteOverviewDto } from './trip-route-overview.dto.js';

export class TripItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  placeId: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '11:00' })
  endTime: string;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiProperty()
  sortOrder: number;
}

export class TripDayResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  dayIndex: number;

  @ApiProperty({ format: 'date' })
  date: string;

  @ApiProperty({ type: [TripItemResponseDto] })
  items: TripItemResponseDto[];
}

export class TripResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  destinationId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ format: 'date' })
  startDate: string;

  @ApiProperty({ format: 'date' })
  endDate: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: [TripDayResponseDto] })
  days: TripDayResponseDto[];

  @ApiPropertyOptional({ type: TripRouteOverviewDto, nullable: true })
  routeOverview?: TripRouteOverviewDto | null;
}
