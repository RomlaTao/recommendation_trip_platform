import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import type { Job } from 'bull';
import {
  NOTIFICATION_DELIVERY_REPOSITORY,
  NOTIFICATION_EMAIL,
} from '../../application/notification.di-tokens.js';
import type { NotificationDeliveryRepositoryPort } from '../../application/ports/notification-delivery.repository.port.js';
import type { NotificationEmailPort } from '../../application/ports/notification-email.port.js';
import {
  NOTIFICATION_JOBS,
  NOTIFICATION_QUEUE_NAME,
  NOTIFICATION_TEMPLATES,
} from '../../notification.constants.js';
import type { SendEmailNotificationJobPayload } from '../../notification.types.js';
import type {
  PlaceApprovedNotificationPayload,
  PlaceRejectedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../../notification.types.js';

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor {
  constructor(
    @Inject(NOTIFICATION_EMAIL)
    private readonly notificationEmail: NotificationEmailPort,
    @Inject(NOTIFICATION_DELIVERY_REPOSITORY)
    private readonly deliveryRepository: NotificationDeliveryRepositoryPort,
  ) {}

  @Process(NOTIFICATION_JOBS.SEND_EMAIL)
  async handleSendEmail(
    job: Job<SendEmailNotificationJobPayload>,
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findById(job.data.deliveryId);
    if (!delivery) {
      return;
    }

    try {
      switch (job.data.templateCode) {
        case NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL:
          await this.notificationEmail.sendVerifyEmail(
            job.data.payload as VerifyEmailNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_APPROVED:
          await this.notificationEmail.sendPlaceApprovedEmail(
            job.data.payload as PlaceApprovedNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_REJECTED:
          await this.notificationEmail.sendPlaceRejectedEmail(
            job.data.payload as PlaceRejectedNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED:
          await this.notificationEmail.sendPlaceRequestSubmittedEmail(
            job.data.payload as PlaceRequestSubmittedNotificationPayload,
          );
          break;
        default: {
          const templateCode = job.data.templateCode as string;
          throw new Error(`unsupported_notification_template:${templateCode}`);
        }
      }

      await this.deliveryRepository.markSent(delivery.id, delivery.attempts);
    } catch (error) {
      await this.deliveryRepository.markFailed(delivery.id, error);
      throw error;
    }
  }

  @OnQueueFailed()
  async handleFailed(
    job: Job<SendEmailNotificationJobPayload>,
    error: Error,
  ): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      return;
    }

    await this.deliveryRepository.markDeadLetter(job.data.deliveryId, error);
  }
}
