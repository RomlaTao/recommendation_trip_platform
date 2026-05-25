import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_PREFERENCE_TYPES } from '../../notification.constants.js';
import type { NotificationPreferenceType } from '../../notification.types.js';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from '../notification.di-tokens.js';
import type { UpsertNotificationPreferenceCommand } from '../commands/upsert-notification-preference.command.js';
import type { NotificationPreferenceModel } from '../models/notification-preference.model.js';
import type { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port.js';
import type { NotificationRepositoryPort } from '../ports/notification.repository.port.js';
import type { ListNotificationsQuery } from '../queries/list-notifications.query.js';
import type { ListNotificationsResult } from '../queries/list-notifications.query.js';

@Injectable()
export class NotificationQueryService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: NotificationPreferenceRepositoryPort,
  ) {}

  listMyNotifications(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<ListNotificationsResult> {
    return this.notificationRepository.listForUser(userId, query);
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<{ success: true }> {
    await this.notificationRepository.markAsRead(userId, notificationId);
    return { success: true };
  }

  listMyPreferences(userId: string): Promise<NotificationPreferenceModel[]> {
    return this.resolveAllPreferences(userId);
  }

  upsertMyPreference(
    userId: string,
    type: NotificationPreferenceType,
    command: UpsertNotificationPreferenceCommand,
  ): Promise<NotificationPreferenceModel> {
    return this.preferenceRepository.upsert(userId, type, command);
  }

  private async resolveAllPreferences(
    userId: string,
  ): Promise<NotificationPreferenceModel[]> {
    const stored = await this.preferenceRepository.listByUser(userId);
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
}
