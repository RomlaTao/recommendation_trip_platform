import type {
  PlaceApprovedNotificationPayload,
  PlaceRejectedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../../notification.types.js';

export interface NotificationEmailPort {
  sendVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void>;
  sendPlaceApprovedEmail(
    payload: PlaceApprovedNotificationPayload,
  ): Promise<void>;
  sendPlaceRejectedEmail(
    payload: PlaceRejectedNotificationPayload,
  ): Promise<void>;
  sendPlaceRequestSubmittedEmail(
    payload: PlaceRequestSubmittedNotificationPayload,
  ): Promise<void>;
}
