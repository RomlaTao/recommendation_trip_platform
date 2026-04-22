import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../../core/database/base.entity.js';

export type SnapshotEventStatus = 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';

@Entity('place_rating_snapshot_events')
export class PlaceRatingSnapshotEventOrmEntity extends BaseEntity {
  @Index('IDX_place_rating_snapshot_events_event_id', { unique: true })
  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  @Column({ type: 'varchar', length: 32 })
  status: SnapshotEventStatus;

  @Column({ type: 'uuid' })
  placeId: string;

  @Column({ type: 'uuid' })
  aggregateId: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: unknown;
}
