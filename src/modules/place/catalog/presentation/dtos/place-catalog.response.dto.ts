import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceRatingBlockDto {
  @ApiPropertyOptional({ example: 4.5, nullable: true })
  averageRating: number | null;

  @ApiProperty({ example: 120 })
  reviewCount: number;
}

export class PlaceListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Sunset Beach Cafe' })
  name: string;

  @ApiProperty({ example: '15 Tran Phu, Vung Tau' })
  address: string;

  @ApiProperty({ example: 10.3484864 })
  lat: number;

  @ApiProperty({ example: 107.0761821 })
  lng: number;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl: string | null;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty({ example: 'Cafe' })
  categoryName: string;

  @ApiProperty({ type: PlaceRatingBlockDto })
  communityRating: PlaceRatingBlockDto;

  @ApiProperty({ type: PlaceRatingBlockDto })
  seedRating: PlaceRatingBlockDto;
}

export class PlaceDetailDto extends PlaceListItemDto {
  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  imageUrls: string[] | null;
}

export class NearbyPlaceDto extends PlaceListItemDto {
  @ApiProperty({ example: 1280.3 })
  distanceInMeters: number;
}

export class PlaceCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Cafe' })
  name: string;

  @ApiProperty({ example: 'cafe' })
  slug: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId: string | null;
}

export class PaginatedPlacesDto {
  @ApiProperty({ type: [PlaceListItemDto] })
  items: PlaceListItemDto[];

  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
