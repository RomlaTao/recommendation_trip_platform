import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../../core/database/base.entity.js';
import type { NotificationPreferenceType } from '../../../notification.types.js';

@Entity('notification_preferences')
@Index('IDX_notification_preferences_user_type_unique', ['userId', 'type'], {
  unique: true,
})
export class NotificationPreferenceOrmEntity extends BaseEntity {
  @Index('IDX_notification_preferences_user_id')
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  type: NotificationPreferenceType;

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  inAppEnabled: boolean;
}
