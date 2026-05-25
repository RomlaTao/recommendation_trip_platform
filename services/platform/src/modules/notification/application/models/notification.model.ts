export interface NotificationModel {
  id: string;
  sourceEventId: string;
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  data: unknown | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
