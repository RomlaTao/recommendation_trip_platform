import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { UsersService } from '../../user/users.service.js';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PREFERENCE_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TEMPLATES,
} from '../notification.constants.js';
import { NotificationDeliveryEntity } from '../entities/notification-delivery.entity.js';
import { NotificationEntity } from '../entities/notification.entity.js';
import { NotificationPreferenceEntity } from '../entities/notification-preference.entity.js';
import { ListNotificationsQueryDto } from '../dto/list-notifications.query.dto.js';
import { UpsertNotificationPreferenceDto } from '../dto/upsert-notification-preference.dto.js';
import {
  NotificationPreferenceSnapshot,
  NotificationPreferenceType,
  NotificationTemplate,
  PlaceApprovedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  PlaceRejectedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../notification.types.js';
import { NotificationQueueService } from '../queue/notification.queue.service.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveryRepository: Repository<NotificationDeliveryEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly preferenceRepository: Repository<NotificationPreferenceEntity>,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly usersService: UsersService,
  ) {}

  async notifyVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void> {
    const sourceEventId = this.buildSourceEventId(
      'auth_verify_email',
      payload.to.trim().toLowerCase(),
      payload.verifyToken,
    );
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

  async notifyPlaceApproved(input: { actorUserId: string; placeId: string }): Promise<void> {
    const user = await this.usersService.findById(input.actorUserId);
    if (!user?.email) {
      return;
    }
    const payload: PlaceApprovedNotificationPayload = {
      to: user.email,
      placeId: input.placeId,
    };
    const sourceEventId = this.buildSourceEventId(
      'place_approved',
      input.placeId,
      input.actorUserId,
    );
    const preference = await this.resolvePreference(
      input.actorUserId,
      NOTIFICATION_PREFERENCE_TYPES.PLACE_APPROVED,
    );

    if (preference.emailEnabled) {
      await this.createDeliveryAndEnqueue(sourceEventId, NOTIFICATION_TEMPLATES.PLACE_APPROVED, payload);
    }
    if (preference.inAppEnabled) {
      await this.createInAppNotification({
        sourceEventId,
        recipientUserId: input.actorUserId,
        type: NOTIFICATION_TEMPLATES.PLACE_APPROVED,
        title: 'Place approved',
        body: `Your place (${input.placeId}) has been approved and is now visible on catalog.`,
        data: { placeId: input.placeId },
      });
    }
  }

  async notifyPlaceRejected(input: {
    actorUserId: string;
    placeId: string;
    reason: string;
  }): Promise<void> {
    const user = await this.usersService.findById(input.actorUserId);
    if (!user?.email) {
      return;
    }
    const payload: PlaceRejectedNotificationPayload = {
      to: user.email,
      placeId: input.placeId,
      reason: input.reason,
    };
    const sourceEventId = this.buildSourceEventId(
      'place_rejected',
      input.placeId,
      input.actorUserId,
    );
    const preference = await this.resolvePreference(
      input.actorUserId,
      NOTIFICATION_PREFERENCE_TYPES.PLACE_REJECTED,
    );

    if (preference.emailEnabled) {
      await this.createDeliveryAndEnqueue(sourceEventId, NOTIFICATION_TEMPLATES.PLACE_REJECTED, payload);
    }
    if (preference.inAppEnabled) {
      await this.createInAppNotification({
        sourceEventId,
        recipientUserId: input.actorUserId,
        type: NOTIFICATION_TEMPLATES.PLACE_REJECTED,
        title: 'Place rejected',
        body: `Your place (${input.placeId}) was rejected. Reason: ${input.reason}`,
        data: { placeId: input.placeId, reason: input.reason },
      });
    }
  }

  async notifyPlaceRequestSubmitted(input: {
    recipientUserId: string;
    requestId: string;
    placeName: string;
    requesterUserId: string;
  }): Promise<void> {
    const user = await this.usersService.findById(input.recipientUserId);
    if (!user?.email) {
      return;
    }
    const payload: PlaceRequestSubmittedNotificationPayload = {
      to: user.email,
      requestId: input.requestId,
      placeName: input.placeName,
      requesterUserId: input.requesterUserId,
    };
    const sourceEventId = this.buildSourceEventId(
      'place_request_submitted',
      input.requestId,
      input.recipientUserId,
    );

    await this.createDeliveryAndEnqueue(
      sourceEventId,
      NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED,
      payload,
    );
    await this.createInAppNotification({
      sourceEventId,
      recipientUserId: input.recipientUserId,
      type: NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED,
      title: 'New place request submitted',
      body: `A new place request "${input.placeName}" has been submitted and needs moderation.`,
      data: {
        requestId: input.requestId,
        requesterUserId: input.requesterUserId,
      },
    });
  }

  async listMyNotifications(userId: string, query: ListNotificationsQueryDto) {
    const where: Record<string, unknown> = {
      recipientUserId: userId,
      deletedAt: IsNull(),
    };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<{ success: true }> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientUserId: userId, deletedAt: IsNull() },
    });
    if (!notification) {
      return { success: true };
    }

    await this.notificationRepository.update(
      { id: notificationId },
      { isRead: true, readAt: notification.readAt ?? new Date() },
    );
    return { success: true };
  }

  async listMyPreferences(userId: string) {
    const stored = await this.preferenceRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { type: 'ASC' },
    });

    const map = new Map(stored.map((item) => [item.type, item]));
    return Object.values(NOTIFICATION_PREFERENCE_TYPES).map((type) => {
      const existing = map.get(type);
      return {
        type,
        emailEnabled: existing?.emailEnabled ?? true,
        inAppEnabled: existing?.inAppEnabled ?? true,
      };
    });
  }

  async upsertMyPreference(
    userId: string,
    type: NotificationPreferenceType,
    dto: UpsertNotificationPreferenceDto,
  ) {
    const existing = await this.preferenceRepository.findOne({
      where: { userId, type, deletedAt: IsNull() },
    });

    if (!existing) {
      const created = await this.preferenceRepository.save(
        this.preferenceRepository.create({
          userId,
          type,
          emailEnabled: dto.emailEnabled ?? true,
          inAppEnabled: dto.inAppEnabled ?? true,
        }),
      );
      return {
        type: created.type,
        emailEnabled: created.emailEnabled,
        inAppEnabled: created.inAppEnabled,
      };
    }

    existing.emailEnabled = dto.emailEnabled ?? existing.emailEnabled;
    existing.inAppEnabled = dto.inAppEnabled ?? existing.inAppEnabled;
    const saved = await this.preferenceRepository.save(existing);
    return {
      type: saved.type,
      emailEnabled: saved.emailEnabled,
      inAppEnabled: saved.inAppEnabled,
    };
  }

  private async createDeliveryAndEnqueue(
    sourceEventId: string,
    templateCode: NotificationTemplate,
    payload:
      | VerifyEmailNotificationPayload
      | PlaceApprovedNotificationPayload
      | PlaceRejectedNotificationPayload
      | PlaceRequestSubmittedNotificationPayload,
  ): Promise<void> {
    const existing = await this.deliveryRepository.findOne({ where: { sourceEventId } });
    if (existing) {
      return;
    }

    const delivery = await this.deliveryRepository.save(
      this.deliveryRepository.create({
        sourceEventId,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        templateCode,
        recipient: payload.to,
        payload,
        status: NOTIFICATION_STATUSES.PENDING,
        attempts: 0,
      }),
    );

    await this.notificationQueueService.enqueueSendEmail({
      deliveryId: delivery.id,
      templateCode,
      payload,
    });
  }

  private async createInAppNotification(input: {
    sourceEventId: string;
    recipientUserId: string;
    type: string;
    title: string;
    body: string;
    data?: unknown;
  }): Promise<void> {
    const existing = await this.notificationRepository.findOne({
      where: { sourceEventId: input.sourceEventId },
    });
    if (existing) {
      return;
    }

    await this.notificationRepository.save(
      this.notificationRepository.create({
        sourceEventId: input.sourceEventId,
        recipientUserId: input.recipientUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
        isRead: false,
      }),
    );
  }

  private async resolvePreference(
    userId: string,
    type: NotificationPreferenceType,
  ): Promise<NotificationPreferenceSnapshot> {
    const existing = await this.preferenceRepository.findOne({
      where: { userId, type, deletedAt: IsNull() },
    });
    if (!existing) {
      return {
        type,
        emailEnabled: true,
        inAppEnabled: true,
      };
    }
    return {
      type: existing.type,
      emailEnabled: existing.emailEnabled,
      inAppEnabled: existing.inAppEnabled,
    };
  }

  private buildSourceEventId(prefix: string, ...parts: string[]): string {
    const raw = parts.join(':');
    const digest = createHash('sha256').update(raw).digest('hex');
    return `${prefix}:${digest}`;
  }
}
