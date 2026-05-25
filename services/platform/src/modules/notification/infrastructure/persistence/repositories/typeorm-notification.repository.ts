import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type {
  CreateInAppNotificationInput,
  NotificationRepositoryPort,
} from '../../../application/ports/notification.repository.port.js';
import type { ListNotificationsQuery } from '../../../application/queries/list-notifications.query.js';
import { NotificationMapper } from '../mappers/notification.mapper.js';
import { NotificationOrmEntity } from '../typeorm/notification.orm-entity.js';

@Injectable()
export class TypeormNotificationRepository implements NotificationRepositoryPort {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly notificationRepository: Repository<NotificationOrmEntity>,
  ) {}

  async existsBySourceEventId(sourceEventId: string): Promise<boolean> {
    const count = await this.notificationRepository.count({
      where: { sourceEventId },
    });
    return count > 0;
  }

  async createInApp(input: CreateInAppNotificationInput) {
    const saved = await this.notificationRepository.save(
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
    return NotificationMapper.toModel(saved);
  }

  async listForUser(userId: string, query: ListNotificationsQuery) {
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
      items: items.map((item) => NotificationMapper.toModel(item)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipientUserId: userId,
        deletedAt: IsNull(),
      },
    });
    if (!notification) {
      return;
    }

    await this.notificationRepository.update(
      { id: notificationId },
      { isRead: true, readAt: notification.readAt ?? new Date() },
    );
  }
}
