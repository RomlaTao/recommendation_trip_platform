import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

@Entity('place_reviews')
@Index('IDX_place_reviews_place_id', ['placeId'])
@Index('IDX_place_reviews_user_place_unique', ['userId', 'placeId'], {
  unique: true,
})
export class PlaceReviewOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  placeId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  imageUrls?: string[] | null;
}
