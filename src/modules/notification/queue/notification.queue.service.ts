import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { NOTIFICATION_JOBS, NOTIFICATION_QUEUE_NAME } from '../notification.constants.js';
import { SendEmailNotificationJobPayload } from '../notification.types.js';

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue(NOTIFICATION_QUEUE_NAME)
    private readonly notificationQueue: Queue,
  ) {}

  async enqueueSendEmail(payload: SendEmailNotificationJobPayload): Promise<void> {
    await this.notificationQueue.add(NOTIFICATION_JOBS.SEND_EMAIL, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
