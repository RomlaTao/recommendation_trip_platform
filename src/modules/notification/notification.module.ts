import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NOTIFICATION_QUEUE_NAME } from './notification.constants.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';
import { NotificationEmailService } from './services/notification-email.service.js';
import { NotificationProcessor } from './queue/notification.processor.js';
import { NotificationQueueService } from './queue/notification.queue.service.js';
import { NotificationService } from './services/notification.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationDeliveryEntity]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
  ],
  providers: [
    NotificationEmailService,
    NotificationProcessor,
    NotificationQueueService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
