import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReviewListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  placeId: string;

  @ApiProperty()
  placeName: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  authorName: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}

export class PaginatedAdminReviewsDto {
  @ApiProperty({ type: [AdminReviewListItemDto] })
  items: AdminReviewListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
