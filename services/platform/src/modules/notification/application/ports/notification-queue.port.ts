import type { SendEmailNotificationJobPayload } from '../../notification.types.js';

export interface NotificationQueuePort {
  enqueueSendEmail(payload: SendEmailNotificationJobPayload): Promise<void>;
}
