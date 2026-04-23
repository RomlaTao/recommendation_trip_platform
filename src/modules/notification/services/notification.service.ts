import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TEMPLATES,
} from '../notification.constants.js';
import { NotificationDeliveryEntity } from '../entities/notification-delivery.entity.js';
import { VerifyEmailNotificationPayload } from '../notification.types.js';
import { NotificationQueueService } from '../queue/notification.queue.service.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveryRepository: Repository<NotificationDeliveryEntity>,
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

  async notifyVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void> {
    const sourceEventId = `auth_verify_email:${payload.to}:${payload.verifyToken}`;
    const existing = await this.deliveryRepository.findOne({ where: { sourceEventId } });
    if (existing) {
      return;
    }

    const delivery = await this.deliveryRepository.save(
      this.deliveryRepository.create({
        sourceEventId,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        templateCode: NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL,
        recipient: payload.to,
        payload,
        status: NOTIFICATION_STATUSES.PENDING,
        attempts: 0,
      }),
    );

    await this.notificationQueueService.enqueueSendEmail({
      deliveryId: delivery.id,
      templateCode: NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL,
      payload,
    });
  }
}
