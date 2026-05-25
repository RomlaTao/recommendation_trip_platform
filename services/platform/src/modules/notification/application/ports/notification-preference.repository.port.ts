import type { NotificationPreferenceType } from '../../notification.types.js';
import type { NotificationPreferenceModel } from '../models/notification-preference.model.js';
import type { UpsertNotificationPreferenceCommand } from '../commands/upsert-notification-preference.command.js';

export interface NotificationPreferenceRepositoryPort {
  findByUserAndType(
    userId: string,
    type: NotificationPreferenceType,
  ): Promise<NotificationPreferenceModel | null>;
  listByUser(userId: string): Promise<NotificationPreferenceModel[]>;
  upsert(
    userId: string,
    type: NotificationPreferenceType,
    command: UpsertNotificationPreferenceCommand,
  ): Promise<NotificationPreferenceModel>;
}
