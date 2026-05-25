import type { NotificationModel } from '../models/notification.model.js';

export interface ListNotificationsQuery {
  page: number;
  limit: number;
  isRead?: boolean;
}

export interface ListNotificationsResult {
  items: NotificationModel[];
  total: number;
  page: number;
  limit: number;
}
