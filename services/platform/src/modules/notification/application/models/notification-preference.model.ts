import type { NotificationPreferenceType } from '../../notification.types.js';

export interface NotificationPreferenceModel {
  type: NotificationPreferenceType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}
