import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES, NOTIFICATION_TEMPLATES } from './notification.constants.js';

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
export type NotificationTemplate =
  (typeof NOTIFICATION_TEMPLATES)[keyof typeof NOTIFICATION_TEMPLATES];
export type NotificationStatus =
  (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];

export interface VerifyEmailNotificationPayload {
  to: string;
  username?: string;
  verifyToken: string;
}

export interface SendEmailNotificationJobPayload {
  deliveryId: string;
  templateCode: NotificationTemplate;
  payload: VerifyEmailNotificationPayload;
}
