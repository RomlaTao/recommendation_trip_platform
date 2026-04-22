import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';
import { PlaceDataSource } from '../../../enums/place-data-source.enum.js';
import { PlaceDeletionActorRole } from '../../../enums/place-deletion-actor-role.enum.js';
import { PlaceStatus } from '../../../enums/place-status.enum.js';
import { PartnerOrmEntity } from './partner.orm-entity.js';
import { PlaceCategoryOrmEntity } from './place-category.orm-entity.js';

@Entity('places')
@Index('IDX_places_catalog_active_category_updated', ['categoryId', 'updatedAt'], {
  where: `"deletedAt" IS NULL AND "status" = 'APPROVED'`,
})
@Index('IDX_places_catalog_active_rating_id', ['averageRating', 'id'], {
  where: `"deletedAt" IS NULL AND "status" = 'APPROVED'`,
})
@Index('IDX_places_catalog_active_name_id', ['name', 'id'], {
  where: `"deletedAt" IS NULL AND "status" = 'APPROVED'`,
})
export class PlaceOrmEntity extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'varchar', length: 500 })
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty()
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ example: 10.35 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: string;

  @ApiProperty({ example: 107.08 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: string;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  openingHours?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  imageUrls?: string[] | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 2048, nullable: true })
  thumbnailUrl?: string | null;

  @ApiProperty({ enum: PlaceStatus })
  @Column({ type: 'varchar', length: 32 })
  status: PlaceStatus;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  seedAverageRating?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'int', nullable: true })
  seedReviewCount?: number | null;

  @ApiPropertyOptional()
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: string | null;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @ApiPropertyOptional()
  @Column({ type: 'timestamp with time zone', nullable: true })
  ratingLastUpdatedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'PostgreSQL allows multiple NULLs on a UNIQUE column when unset.',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googlePlaceId?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  tagScores?: Record<string, number> | null;

  @ApiProperty({ enum: PlaceDataSource })
  @Column({ type: 'varchar', length: 32 })
  dataSource: PlaceDataSource;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', length: 64, nullable: true })
  importBatchId?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  deletedReason?: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'uuid', nullable: true })
  deletedByUserId?: string | null;

  @ApiPropertyOptional({ enum: PlaceDeletionActorRole })
  @Column({ type: 'varchar', length: 16, nullable: true })
  deletedByRole?: PlaceDeletionActorRole | null;

  @ApiProperty()
  @Index('IDX_places_partner_id')
  @Column({ type: 'uuid' })
  partnerId: string;

  @ApiProperty()
  @ManyToOne(() => PartnerOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerOrmEntity;

  @ApiProperty()
  @Index('IDX_places_category_id')
  @Column({ type: 'uuid' })
  categoryId: string;

  @ApiProperty()
  @ManyToOne(() => PlaceCategoryOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: PlaceCategoryOrmEntity;
}
