import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { NotificationPreferenceType } from '../../../notification.types.js';
import type { UpsertNotificationPreferenceCommand } from '../../../application/commands/upsert-notification-preference.command.js';
import type { NotificationPreferenceRepositoryPort } from '../../../application/ports/notification-preference.repository.port.js';
import { NotificationMapper } from '../mappers/notification.mapper.js';
import { NotificationPreferenceOrmEntity } from '../typeorm/notification-preference.orm-entity.js';

@Injectable()
export class TypeormNotificationPreferenceRepository implements NotificationPreferenceRepositoryPort {
  constructor(
    @InjectRepository(NotificationPreferenceOrmEntity)
    private readonly preferenceRepository: Repository<NotificationPreferenceOrmEntity>,
  ) {}

  async findByUserAndType(userId: string, type: NotificationPreferenceType) {
    const existing = await this.preferenceRepository.findOne({
      where: { userId, type, deletedAt: IsNull() },
    });
    return existing ? NotificationMapper.toPreferenceModel(existing) : null;
  }

  async listByUser(userId: string) {
    const stored = await this.preferenceRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { type: 'ASC' },
    });
    return stored.map((item) => NotificationMapper.toPreferenceModel(item));
  }

  async upsert(
    userId: string,
    type: NotificationPreferenceType,
    command: UpsertNotificationPreferenceCommand,
  ) {
    const existing = await this.preferenceRepository.findOne({
      where: { userId, type, deletedAt: IsNull() },
    });

    if (!existing) {
      const created = await this.preferenceRepository.save(
        this.preferenceRepository.create({
          userId,
          type,
          emailEnabled: command.emailEnabled ?? true,
          inAppEnabled: command.inAppEnabled ?? true,
        }),
      );
      return NotificationMapper.toPreferenceModel(created);
    }

    existing.emailEnabled = command.emailEnabled ?? existing.emailEnabled;
    existing.inAppEnabled = command.inAppEnabled ?? existing.inAppEnabled;
    const saved = await this.preferenceRepository.save(existing);
    return NotificationMapper.toPreferenceModel(saved);
  }
}
