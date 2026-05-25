import type { NotificationModel } from '../models/notification.model.js';
import type { ListNotificationsQuery } from '../queries/list-notifications.query.js';
import type { ListNotificationsResult } from '../queries/list-notifications.query.js';

export interface CreateInAppNotificationInput {
  sourceEventId: string;
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  data?: unknown;
}

export interface NotificationRepositoryPort {
  existsBySourceEventId(sourceEventId: string): Promise<boolean>;
  createInApp(input: CreateInAppNotificationInput): Promise<NotificationModel>;
  listForUser(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<ListNotificationsResult>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
}
