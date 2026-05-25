import type { NotificationModel } from '../../../application/models/notification.model.js';
import type { NotificationPreferenceModel } from '../../../application/models/notification-preference.model.js';
import { NotificationOrmEntity } from '../typeorm/notification.orm-entity.js';
import { NotificationPreferenceOrmEntity } from '../typeorm/notification-preference.orm-entity.js';

export class NotificationMapper {
  static toModel(entity: NotificationOrmEntity): NotificationModel {
    return {
      id: entity.id,
      sourceEventId: entity.sourceEventId,
      recipientUserId: entity.recipientUserId,
      type: entity.type,
      title: entity.title,
      body: entity.body,
      data: entity.data ?? null,
      isRead: entity.isRead,
      readAt: entity.readAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toPreferenceModel(
    entity: NotificationPreferenceOrmEntity,
  ): NotificationPreferenceModel {
    return {
      type: entity.type,
      emailEnabled: entity.emailEnabled,
      inAppEnabled: entity.inAppEnabled,
    };
  }
}
