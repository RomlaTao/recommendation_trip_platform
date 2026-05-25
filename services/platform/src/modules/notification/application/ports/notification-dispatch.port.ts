import type { NotifyPlaceApprovedCommand } from '../commands/notify-place-approved.command.js';
import type { NotifyPlaceRejectedCommand } from '../commands/notify-place-rejected.command.js';
import type { NotifyPlaceRequestSubmittedCommand } from '../commands/notify-place-request-submitted.command.js';
import type { VerifyEmailNotificationPayload } from '../../notification.types.js';

export interface NotificationDispatchPort {
  notifyVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void>;
  notifyPlaceApproved(command: NotifyPlaceApprovedCommand): Promise<void>;
  notifyPlaceRejected(command: NotifyPlaceRejectedCommand): Promise<void>;
  notifyPlaceRequestSubmitted(
    command: NotifyPlaceRequestSubmittedCommand,
  ): Promise<void>;
}
