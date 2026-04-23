import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

@Entity('place_reviews')
@Index('IDX_place_reviews_place_id', ['placeId'])
@Index('IDX_place_reviews_user_place_unique', ['userId', 'placeId'], { unique: true })
export class PlaceReviewOrmEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  placeId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Column({ type: 'smallint' })
  rating: number;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @Column({ type: 'jsonb', nullable: true })
  imageUrls?: string[] | null;
}
