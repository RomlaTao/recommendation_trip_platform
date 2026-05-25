import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../core/database/base.entity.js';
import type {
  NotificationChannel,
  NotificationStatus,
} from '../../../notification.types.js';

@Entity('notification_deliveries')
export class NotificationDeliveryOrmEntity extends BaseEntity {
  @Index('IDX_notification_deliveries_source_event', { unique: true })
  @Column({ type: 'varchar', length: 128 })
  sourceEventId: string;

  @Column({ type: 'varchar', length: 32 })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 64 })
  templateCode: string;

  @Index('IDX_notification_deliveries_recipient')
  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'jsonb' })
  payload: unknown;

  @Index('IDX_notification_deliveries_status')
  @Column({ type: 'varchar', length: 16 })
  status: NotificationStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt?: Date | null;
}
