import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PREFERENCE_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TEMPLATES,
} from './notification.constants.js';

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
export type NotificationTemplate =
  (typeof NOTIFICATION_TEMPLATES)[keyof typeof NOTIFICATION_TEMPLATES];
export type NotificationStatus =
  (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];
export type NotificationPreferenceType =
  (typeof NOTIFICATION_PREFERENCE_TYPES)[keyof typeof NOTIFICATION_PREFERENCE_TYPES];

export interface VerifyEmailNotificationPayload {
  to: string;
  username?: string;
  verifyToken: string;
}

export interface PlaceApprovedNotificationPayload {
  to: string;
  placeId: string;
}

export interface PlaceRejectedNotificationPayload {
  to: string;
  placeId: string;
  reason: string;
}

export interface PlaceRequestSubmittedNotificationPayload {
  to: string;
  requestId: string;
  placeName: string;
  requesterUserId: string;
}

export interface SendEmailNotificationJobPayload {
  deliveryId: string;
  templateCode: NotificationTemplate;
  payload:
    | VerifyEmailNotificationPayload
    | PlaceApprovedNotificationPayload
    | PlaceRejectedNotificationPayload
    | PlaceRequestSubmittedNotificationPayload;
}

export interface NotificationPreferenceSnapshot {
  type: NotificationPreferenceType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}
