import type { NotificationModel } from '../../application/models/notification.model.js';
import type { NotificationPreferenceModel } from '../../application/models/notification-preference.model.js';
import type {
  NotificationDto,
  NotificationPreferenceDto,
} from '../dtos/notification-response.dto.js';

export class NotificationPresentationMapper {
  static toNotificationResponse(model: NotificationModel): NotificationDto {
    return {
      id: model.id,
      sourceEventId: model.sourceEventId,
      recipientUserId: model.recipientUserId,
      type: model.type,
      title: model.title,
      body: model.body,
      data: model.data,
      isRead: model.isRead,
      readAt: model.readAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toPreferenceResponse(
    model: NotificationPreferenceModel,
  ): NotificationPreferenceDto {
    return {
      type: model.type,
      emailEnabled: model.emailEnabled,
      inAppEnabled: model.inAppEnabled,
    };
  }
}
