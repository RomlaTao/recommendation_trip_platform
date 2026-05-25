import { Inject, Injectable } from '@nestjs/common';
import { REALTIME_EMITTER } from '../../../../core/realtime/realtime.di-tokens.js';
import type { RealtimeEmitterPort } from '../../../../core/realtime/ports/realtime-emitter.port.js';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PREFERENCE_TYPES,
  NOTIFICATION_REALTIME_EVENT,
  NOTIFICATION_TEMPLATES,
} from '../../notification.constants.js';
import type {
  NotificationPreferenceType,
  NotificationTemplate,
  PlaceApprovedNotificationPayload,
  PlaceRejectedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../../notification.types.js';
import type { NotifyPlaceApprovedCommand } from '../commands/notify-place-approved.command.js';
import type { NotifyPlaceRejectedCommand } from '../commands/notify-place-rejected.command.js';
import type { NotifyPlaceRequestSubmittedCommand } from '../commands/notify-place-request-submitted.command.js';
import {
  NOTIFICATION_DELIVERY_REPOSITORY,
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NOTIFICATION_QUEUE,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_USER_LOOKUP,
} from '../notification.di-tokens.js';
import type { NotificationDispatchPort } from '../ports/notification-dispatch.port.js';
import type { NotificationDeliveryRepositoryPort } from '../ports/notification-delivery.repository.port.js';
import type { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port.js';
import type { NotificationQueuePort } from '../ports/notification-queue.port.js';
import type { NotificationRepositoryPort } from '../ports/notification.repository.port.js';
import type { NotificationUserLookupPort } from '../ports/notification-user-lookup.port.js';
import { buildSourceEventId } from '../utils/build-source-event-id.js';
import { toNotificationRealtimePayload } from '../utils/notification-realtime-payload.js';

@Injectable()
export class NotificationDispatchService implements NotificationDispatchPort {
  constructor(
    @Inject(NOTIFICATION_DELIVERY_REPOSITORY)
    private readonly deliveryRepository: NotificationDeliveryRepositoryPort,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: NotificationPreferenceRepositoryPort,
    @Inject(NOTIFICATION_QUEUE)
    private readonly notificationQueue: NotificationQueuePort,
    @Inject(NOTIFICATION_USER_LOOKUP)
    private readonly userLookup: NotificationUserLookupPort,
    @Inject(REALTIME_EMITTER)
    private readonly realtimeEmitter: RealtimeEmitterPort,
  ) {}

  async notifyVerifyEmail(
    payload: VerifyEmailNotificationPayload,
  ): Promise<void> {
    const sourceEventId = buildSourceEventId(
      'auth_verify_email',
      payload.to.trim().toLowerCase(),
      payload.verifyToken,
    );
    if (await this.deliveryRepository.existsBySourceEventId(sourceEventId)) {
      return;
    }

    const delivery = await this.deliveryRepository.createPending({
      sourceEventId,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      templateCode: NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL,
      recipient: payload.to,
      payload,
    });

    await this.notificationQueue.enqueueSendEmail({
      deliveryId: delivery.id,
      templateCode: NOTIFICATION_TEMPLATES.AUTH_VERIFY_EMAIL,
      payload,
    });
  }

  async notifyPlaceApproved(
    command: NotifyPlaceApprovedCommand,
  ): Promise<void> {
    const email = await this.userLookup.findEmailByUserId(command.actorUserId);
    if (!email) {
      return;
    }

    const payload: PlaceApprovedNotificationPayload = {
      to: email,
      placeId: command.placeId,
    };
    const sourceEventId = buildSourceEventId(
      'place_approved',
      command.placeId,
      command.actorUserId,
    );
    const preference = await this.resolvePreference(
      command.actorUserId,
      NOTIFICATION_PREFERENCE_TYPES.PLACE_APPROVED,
    );

    if (preference.emailEnabled) {
      await this.createDeliveryAndEnqueue(
        sourceEventId,
        NOTIFICATION_TEMPLATES.PLACE_APPROVED,
        payload,
      );
    }
    if (preference.inAppEnabled) {
      await this.createInAppNotification({
        sourceEventId,
        recipientUserId: command.actorUserId,
        type: NOTIFICATION_TEMPLATES.PLACE_APPROVED,
        title: 'Place approved',
        body: `Your place (${command.placeId}) has been approved and is now visible on catalog.`,
        data: { placeId: command.placeId },
      });
    }
  }

  async notifyPlaceRejected(
    command: NotifyPlaceRejectedCommand,
  ): Promise<void> {
    const email = await this.userLookup.findEmailByUserId(command.actorUserId);
    if (!email) {
      return;
    }

    const payload: PlaceRejectedNotificationPayload = {
      to: email,
      placeId: command.placeId,
      reason: command.reason,
    };
    const sourceEventId = buildSourceEventId(
      'place_rejected',
      command.placeId,
      command.actorUserId,
    );
    const preference = await this.resolvePreference(
      command.actorUserId,
      NOTIFICATION_PREFERENCE_TYPES.PLACE_REJECTED,
    );

    if (preference.emailEnabled) {
      await this.createDeliveryAndEnqueue(
        sourceEventId,
        NOTIFICATION_TEMPLATES.PLACE_REJECTED,
        payload,
      );
    }
    if (preference.inAppEnabled) {
      await this.createInAppNotification({
        sourceEventId,
        recipientUserId: command.actorUserId,
        type: NOTIFICATION_TEMPLATES.PLACE_REJECTED,
        title: 'Place rejected',
        body: `Your place (${command.placeId}) was rejected. Reason: ${command.reason}`,
        data: { placeId: command.placeId, reason: command.reason },
      });
    }
  }

  async notifyPlaceRequestSubmitted(
    command: NotifyPlaceRequestSubmittedCommand,
  ): Promise<void> {
    const email = await this.userLookup.findEmailByUserId(
      command.recipientUserId,
    );
    if (!email) {
      return;
    }

    const payload: PlaceRequestSubmittedNotificationPayload = {
      to: email,
      requestId: command.requestId,
      placeName: command.placeName,
      requesterUserId: command.requesterUserId,
    };
    const sourceEventId = buildSourceEventId(
      'place_request_submitted',
      command.requestId,
      command.recipientUserId,
    );

    await this.createDeliveryAndEnqueue(
      sourceEventId,
      NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED,
      payload,
    );
    await this.createInAppNotification({
      sourceEventId,
      recipientUserId: command.recipientUserId,
      type: NOTIFICATION_TEMPLATES.PLACE_REQUEST_SUBMITTED,
      title: 'New place request submitted',
      body: `A new place request "${command.placeName}" has been submitted and needs moderation.`,
      data: {
        requestId: command.requestId,
        requesterUserId: command.requesterUserId,
      },
    });
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
    if (await this.deliveryRepository.existsBySourceEventId(sourceEventId)) {
      return;
    }

    const delivery = await this.deliveryRepository.createPending({
      sourceEventId,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      templateCode,
      recipient: payload.to,
      payload,
    });

    await this.notificationQueue.enqueueSendEmail({
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
    if (
      await this.notificationRepository.existsBySourceEventId(
        input.sourceEventId,
      )
    ) {
      return;
    }

    const saved = await this.notificationRepository.createInApp(input);

    await this.realtimeEmitter.emitToUser(
      input.recipientUserId,
      NOTIFICATION_REALTIME_EVENT,
      toNotificationRealtimePayload(saved),
    );
  }

  private async resolvePreference(
    userId: string,
    type: NotificationPreferenceType,
  ) {
    const existing = await this.preferenceRepository.findByUserAndType(
      userId,
      type,
    );
    if (!existing) {
      return {
        type,
        emailEnabled: true,
        inAppEnabled: true,
      };
    }
    return existing;
  }
}
