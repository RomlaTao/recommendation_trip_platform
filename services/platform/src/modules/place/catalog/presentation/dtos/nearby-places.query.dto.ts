import { Transform } from 'class-transformer';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class NearbyPlacesQueryDto {
  @ApiProperty({ example: 10.3484864 })
  @Transform(({ value }) => Number(value))
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 107.0761821 })
  @Transform(({ value }) => Number(value))
  @IsLongitude()
  lng: number;

  @ApiPropertyOptional({
    example: 5000,
    default: 5000,
    minimum: 100,
    maximum: 20000,
    description: 'Search radius in meters.',
  })
  @Transform(({ value }) => Number(value ?? 5000))
  @IsInt()
  @Min(100)
  @Max(20000)
  radiusInMeters = 5000;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 30,
  })
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationId?: string;
}
