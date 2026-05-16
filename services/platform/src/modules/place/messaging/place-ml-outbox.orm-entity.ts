import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PlaceMlOutboxStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PUBLISHED'
  | 'FAILED';

@Entity('place_ml_outbox')
export class PlaceMlOutboxOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 64 })
  aggregateType: string;

  @Column({ type: 'uuid' })
  aggregateId: string;

  @Column({ type: 'uuid', unique: true })
  eventId: string;

  @Column({ type: 'varchar', length: 128 })
  eventType: string;

  @Column({ type: 'varchar', length: 256 })
  routingKey: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status: PlaceMlOutboxStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;
}
