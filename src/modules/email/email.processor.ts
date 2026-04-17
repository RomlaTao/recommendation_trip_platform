import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { EMAIL_JOBS, EMAIL_QUEUE_NAME } from './email.constants.js';
import { EmailService } from './email.service.js';
import { SendVerifyEmailJobPayload } from './email.types.js';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process(EMAIL_JOBS.SEND_VERIFY_EMAIL)
  async handleSendVerifyEmail(
    job: Job<SendVerifyEmailJobPayload>,
  ): Promise<void> {
    await this.emailService.sendVerifyEmail(job.data);
  }
}
