import { ApiProperty } from '@nestjs/swagger';

export class TripRouteWaypointDto {
  @ApiProperty({ format: 'uuid' })
  tripItemId: string;

  @ApiProperty({ format: 'uuid' })
  placeId: string;

  @ApiProperty()
  dayIndex: number;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;
}

export class TripRouteOverviewDto {
  @ApiProperty({ format: 'date-time' })
  generatedAt: string;

  @ApiProperty()
  tripVersion: number;

  @ApiProperty({ type: [TripRouteWaypointDto] })
  waypoints: TripRouteWaypointDto[];
}
