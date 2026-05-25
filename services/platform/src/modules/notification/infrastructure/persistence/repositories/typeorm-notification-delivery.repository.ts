import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NOTIFICATION_STATUSES } from '../../../notification.constants.js';
import type {
  CreatePendingDeliveryInput,
  NotificationDeliveryRepositoryPort,
} from '../../../application/ports/notification-delivery.repository.port.js';
import { NotificationDeliveryOrmEntity } from '../typeorm/notification-delivery.orm-entity.js';

@Injectable()
export class TypeormNotificationDeliveryRepository implements NotificationDeliveryRepositoryPort {
  constructor(
    @InjectRepository(NotificationDeliveryOrmEntity)
    private readonly deliveryRepository: Repository<NotificationDeliveryOrmEntity>,
  ) {}

  async existsBySourceEventId(sourceEventId: string): Promise<boolean> {
    const count = await this.deliveryRepository.count({
      where: { sourceEventId },
    });
    return count > 0;
  }

  async createPending(input: CreatePendingDeliveryInput) {
    const saved = await this.deliveryRepository.save(
      this.deliveryRepository.create({
        sourceEventId: input.sourceEventId,
        channel: input.channel,
        templateCode: input.templateCode,
        recipient: input.recipient,
        payload: input.payload,
        status: NOTIFICATION_STATUSES.PENDING,
        attempts: 0,
      }),
    );
    return { id: saved.id, attempts: saved.attempts };
  }

  async findById(id: string) {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      select: { id: true, attempts: true },
    });
    return delivery ? { id: delivery.id, attempts: delivery.attempts } : null;
  }

  async markSent(id: string, attempts: number): Promise<void> {
    await this.deliveryRepository.update(
      { id },
      {
        status: NOTIFICATION_STATUSES.SENT,
        sentAt: new Date(),
        attempts,
        lastError: null,
      },
    );
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    await this.deliveryRepository
      .createQueryBuilder()
      .update()
      .set({
        status: NOTIFICATION_STATUSES.FAILED,
        attempts: () => '"attempts" + 1',
        lastError: this.stringifyError(error),
      })
      .where('"id" = :id', { id })
      .execute();
  }

  async markDeadLetter(id: string, error: unknown): Promise<void> {
    await this.deliveryRepository.update(
      { id },
      {
        status: NOTIFICATION_STATUSES.DEAD_LETTER,
        lastError: this.stringifyError(error),
      },
    );
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`.slice(0, 2000);
    }
    return String(error).slice(0, 2000);
  }
}
