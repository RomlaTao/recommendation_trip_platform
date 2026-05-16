import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NOTIFICATION_QUEUE_NAME } from './notification.constants.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';
import { NotificationEntity } from './entities/notification.entity.js';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity.js';
import { NotificationEmailService } from './services/notification-email.service.js';
import { NotificationProcessor } from './queue/notification.processor.js';
import { NotificationQueueService } from './queue/notification.queue.service.js';
import { NotificationService } from './services/notification.service.js';
import { UsersModule } from '../user/users.module.js';
import { NotificationsController } from './controllers/notifications.controller.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      NotificationDeliveryEntity,
      NotificationEntity,
      NotificationPreferenceEntity,
    ]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationEmailService,
    NotificationProcessor,
    NotificationQueueService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
