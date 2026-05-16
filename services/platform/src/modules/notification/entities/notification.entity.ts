import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Index('IDX_notifications_source_event_id', { unique: true })
  @Column({ type: 'varchar', length: 128 })
  sourceEventId: string;

  @Index('IDX_notifications_recipient_user_id')
  @Column({ type: 'uuid' })
  recipientUserId: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: unknown;

  @Index('IDX_notifications_is_read')
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt?: Date | null;
}
