import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceReviewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  placeId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiPropertyOptional({ type: [String] })
  imageUrls?: string[] | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedPlaceReviewsDto {
  @ApiProperty({ type: [PlaceReviewDto] })
  items: PlaceReviewDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
