import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor.js';
import { EMAIL_QUEUE_NAME } from './email.constants.js';
import { EmailQueueService } from './email.queue.service.js';
import { EmailService } from './email.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: EMAIL_QUEUE_NAME })],
  providers: [EmailService, EmailProcessor, EmailQueueService],
  exports: [EmailQueueService],
})
export class EmailModule {}
