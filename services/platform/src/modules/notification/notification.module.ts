import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NOTIFICATION_DELIVERY_REPOSITORY,
  NOTIFICATION_DISPATCH,
  NOTIFICATION_EMAIL,
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NOTIFICATION_QUEUE,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_USER_LOOKUP,
} from './application/notification.di-tokens.js';
import { NotificationDispatchService } from './application/services/notification-dispatch.service.js';
import { NotificationQueryService } from './application/services/notification-query.service.js';
import { NodemailerNotificationEmailAdapter } from './infrastructure/email/nodemailer-notification-email.adapter.js';
import { NotificationUserLookupAdapter } from './infrastructure/lookups/notification-user-lookup.adapter.js';
import { TypeormNotificationDeliveryRepository } from './infrastructure/persistence/repositories/typeorm-notification-delivery.repository.js';
import { TypeormNotificationPreferenceRepository } from './infrastructure/persistence/repositories/typeorm-notification-preference.repository.js';
import { TypeormNotificationRepository } from './infrastructure/persistence/repositories/typeorm-notification.repository.js';
import { NotificationDeliveryOrmEntity } from './infrastructure/persistence/typeorm/notification-delivery.orm-entity.js';
import { NotificationOrmEntity } from './infrastructure/persistence/typeorm/notification.orm-entity.js';
import { NotificationPreferenceOrmEntity } from './infrastructure/persistence/typeorm/notification-preference.orm-entity.js';
import { BullNotificationQueueAdapter } from './infrastructure/queue/bull-notification-queue.adapter.js';
import { NotificationProcessor } from './infrastructure/queue/notification.processor.js';
import { NOTIFICATION_QUEUE_NAME } from './notification.constants.js';
import { NotificationsController } from './presentation/controllers/notifications.controller.js';
import { UsersModule } from '../user/users.module.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      NotificationDeliveryOrmEntity,
      NotificationOrmEntity,
      NotificationPreferenceOrmEntity,
    ]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationQueryService,
    NotificationDispatchService,
    NotificationProcessor,
    NotificationUserLookupAdapter,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: TypeormNotificationRepository,
    },
    {
      provide: NOTIFICATION_PREFERENCE_REPOSITORY,
      useClass: TypeormNotificationPreferenceRepository,
    },
    {
      provide: NOTIFICATION_DELIVERY_REPOSITORY,
      useClass: TypeormNotificationDeliveryRepository,
    },
    {
      provide: NOTIFICATION_EMAIL,
      useClass: NodemailerNotificationEmailAdapter,
    },
    {
      provide: NOTIFICATION_QUEUE,
      useClass: BullNotificationQueueAdapter,
    },
    {
      provide: NOTIFICATION_USER_LOOKUP,
      useClass: NotificationUserLookupAdapter,
    },
    {
      provide: NOTIFICATION_DISPATCH,
      useExisting: NotificationDispatchService,
    },
  ],
  exports: [NOTIFICATION_DISPATCH],
})
export class NotificationModule {}
