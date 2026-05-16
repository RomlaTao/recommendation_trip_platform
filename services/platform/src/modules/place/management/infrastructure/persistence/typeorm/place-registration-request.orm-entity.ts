import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';
import { PlaceRegistrationRequestStatus } from '../../../enums/place-registration-request-status.enum.js';
import { DestinationOrmEntity } from './destination.orm-entity.js';
import { PartnerOrmEntity } from './partner.orm-entity.js';
import { PlaceCategoryOrmEntity } from './place-category.orm-entity.js';
import { PlaceOrmEntity } from './place.orm-entity.js';

@Entity('place_registration_requests')
@Index('IDX_place_registration_requests_requester_user_id', ['requesterUserId'])
@Index('IDX_place_registration_requests_status_created_at', [
  'status',
  'createdAt',
])
export class PlaceRegistrationRequestOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  requesterUserId: string;

  @Column({ type: 'varchar', length: 32 })
  status: PlaceRegistrationRequestStatus;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'uuid', nullable: true })
  destinationId?: string | null;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'jsonb', nullable: true })
  imageUrls?: string[] | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  thumbnailUrl?: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ type: 'uuid', nullable: true })
  approvedPlaceId?: string | null;

  @ManyToOne(() => PlaceCategoryOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: PlaceCategoryOrmEntity;

  @ManyToOne(() => DestinationOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destinationId' })
  destination?: DestinationOrmEntity | null;

  @ManyToOne(() => PartnerOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerOrmEntity;

  @ManyToOne(() => PlaceOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approvedPlaceId' })
  approvedPlace?: PlaceOrmEntity;
}
