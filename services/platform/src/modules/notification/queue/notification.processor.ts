import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_JOBS,
  NOTIFICATION_QUEUE_NAME,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TEMPLATES,
} from '../notification.constants.js';
import { NotificationDeliveryEntity } from '../entities/notification-delivery.entity.js';
import { SendEmailNotificationJobPayload } from '../notification.types.js';
import {
  PlaceApprovedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  PlaceRejectedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../notification.types.js';
import { NotificationEmailService } from '../services/notification-email.service.js';

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor {
  constructor(
    private readonly notificationEmailService: NotificationEmailService,
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveryRepository: Repository<NotificationDeliveryEntity>,
  ) {}

  @Process(NOTIFICATION_JOBS.SEND_EMAIL)
  async handleSendEmail(
    job: Job<SendEmailNotificationJobPayload>,
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: job.data.deliveryId },
    });
    if (!delivery) {
      return;
    }

    try {
      switch (job.data.templateCode) {
        case NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL:
          await this.notificationEmailService.sendVerifyEmail(
            job.data.payload as VerifyEmailNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_APPROVED:
          await this.notificationEmailService.sendPlaceApprovedEmail(
            job.data.payload as PlaceApprovedNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_REJECTED:
          await this.notificationEmailService.sendPlaceRejectedEmail(
            job.data.payload as PlaceRejectedNotificationPayload,
          );
          break;
        case NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED:
          await this.notificationEmailService.sendPlaceRequestSubmittedEmail(
            job.data.payload as PlaceRequestSubmittedNotificationPayload,
          );
          break;
        default: {
          const templateCode = job.data.templateCode as string;
          throw new Error(`unsupported_notification_template:${templateCode}`);
        }
      }

      await this.deliveryRepository.update(
        { id: delivery.id },
        {
          status: NOTIFICATION_STATUSES.SENT,
          sentAt: new Date(),
          attempts: delivery.attempts,
          lastError: null,
        },
      );
    } catch (error) {
      await this.deliveryRepository.update(
        { id: delivery.id },
        {
          status: NOTIFICATION_STATUSES.FAILED,
          attempts: () => '"attempts" + 1',
          lastError: this.stringifyError(error),
        },
      );
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

    await this.deliveryRepository.update(
      { id: job.data.deliveryId },
      {
        status: NOTIFICATION_STATUSES.DEAD_LETTER,
        lastError: this.stringifyError(error),
      },
    );
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`.slice(0, 2000);
    }
    return String(error).slice(0, 2000);
  }
}
