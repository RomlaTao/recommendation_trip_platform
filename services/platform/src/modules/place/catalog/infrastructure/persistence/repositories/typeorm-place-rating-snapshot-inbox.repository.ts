import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PlaceRatingSnapshotInboxPort } from '../../../application/ports/place-rating-snapshot-inbox.port.js';
import { PlaceRatingUpdatedDomainEvent } from '../../../../shared/events/place-review.events.js';
import { PlaceRatingSnapshotEventOrmEntity } from '../typeorm/place-rating-snapshot-event.orm-entity.js';

@Injectable()
export class TypeormPlaceRatingSnapshotInboxRepository implements PlaceRatingSnapshotInboxPort {
  constructor(
    @InjectRepository(PlaceRatingSnapshotEventOrmEntity)
    private readonly snapshotEventRepository: Repository<PlaceRatingSnapshotEventOrmEntity>,
  ) {}

  async tryStartProcessing(
    event: PlaceRatingUpdatedDomainEvent,
  ): Promise<boolean> {
    const result = await this.snapshotEventRepository
      .createQueryBuilder()
      .insert()
      .values({
        eventId: event.metadata.eventId,
        eventType: event.metadata.eventType,
        status: 'PROCESSING',
        placeId: event.payload.placeId,
        aggregateId: event.metadata.aggregateId,
        attempts: 0,
        payload: event.payload,
      })
      .orIgnore()
      .execute();

    const raw = result.raw as { rowCount?: number } | undefined;
    return (raw?.rowCount ?? 0) > 0;
  }

  async markProcessed(eventId: string): Promise<void> {
    const processedEvent = await this.snapshotEventRepository.findOne({
      where: { eventId },
      select: { attempts: true },
    });
    await this.snapshotEventRepository.update(
      { eventId },
      {
        status: 'PROCESSED',
        attempts: processedEvent?.attempts ?? 0,
        processedAt: new Date(),
        lastError: null,
      },
    );
  }

  async markFailed(eventId: string, error: unknown): Promise<void> {
    await this.snapshotEventRepository
      .createQueryBuilder()
      .update()
      .set({
        status: 'FAILED',
        attempts: () => '"attempts" + 1',
        lastError: this.stringifyError(error),
      })
      .where('"eventId" = :eventId', { eventId })
      .execute();
  }

  async markDeadLetter(
    event: PlaceRatingUpdatedDomainEvent,
    error: unknown,
  ): Promise<void> {
    await this.snapshotEventRepository.update(
      { eventId: event.metadata.eventId },
      {
        status: 'DEAD_LETTER',
        attempts: 5,
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
