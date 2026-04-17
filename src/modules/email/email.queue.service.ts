import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EMAIL_JOBS, EMAIL_QUEUE_NAME } from './email.constants.js';
import { SendVerifyEmailJobPayload } from './email.types.js';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue) {}

  async enqueueVerifyEmail(payload: SendVerifyEmailJobPayload): Promise<void> {
    await this.emailQueue.add(EMAIL_JOBS.SEND_VERIFY_EMAIL, payload, {
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
