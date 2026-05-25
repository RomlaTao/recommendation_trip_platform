import type { NotificationModel } from '../models/notification.model.js';

export function toNotificationRealtimePayload(
  model: NotificationModel,
): Record<string, unknown> {
  return {
    id: model.id,
    sourceEventId: model.sourceEventId,
    recipientUserId: model.recipientUserId,
    type: model.type,
    title: model.title,
    body: model.body,
    data: model.data,
    isRead: model.isRead,
    readAt: model.readAt?.toISOString() ?? null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
