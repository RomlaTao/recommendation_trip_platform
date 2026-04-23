import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlaceRatingSnapshotEventOrmEntity } from '../../infrastructure/persistence/typeorm/place-rating-snapshot-event.orm-entity.js';
import { PlaceRatingUpdatedDomainEvent } from '../../../shared/events/place-review.events.js';

@Injectable()
export class PlaceRatingSnapshotService {
  private readonly logger = new Logger(PlaceRatingSnapshotService.name);

  constructor(
    @InjectRepository(PlaceRatingSnapshotEventOrmEntity)
    private readonly snapshotEventRepository: Repository<PlaceRatingSnapshotEventOrmEntity>,
  ) {}

  async applyPlaceRatingUpdatedEvent(event: PlaceRatingUpdatedDomainEvent): Promise<void> {
    const inserted = await this.tryStartInboxEvent(event);
    if (!inserted) {
      this.logger.debug(`Skip duplicated place rating updated event ${event.metadata.eventId}`);
      return;
    }

    try {
      const processedEvent = await this.snapshotEventRepository.findOne({
        where: { eventId: event.metadata.eventId },
        select: { attempts: true },
      });
      await this.snapshotEventRepository.update(
        { eventId: event.metadata.eventId },
        {
          status: 'PROCESSED',
          attempts: processedEvent?.attempts ?? 0,
          processedAt: new Date(),
          lastError: null,
        },
      );
    } catch (error) {
      await this.markEventFailed(event, error);
      throw error;
    }
  }

  async markEventDeadLetter(event: PlaceRatingUpdatedDomainEvent, error: unknown): Promise<void> {
    await this.snapshotEventRepository.update(
      { eventId: event.metadata.eventId },
      {
        status: 'DEAD_LETTER',
        attempts: 5,
        lastError: this.stringifyError(error),
      },
    );
  }

  private async tryStartInboxEvent(event: PlaceRatingUpdatedDomainEvent): Promise<boolean> {
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

    return (result.raw?.rowCount ?? 0) > 0;
  }

  private async markEventFailed(event: PlaceRatingUpdatedDomainEvent, error: unknown): Promise<void> {
    await this.snapshotEventRepository
      .createQueryBuilder()
      .update()
      .set({
        status: 'FAILED',
        attempts: () => '"attempts" + 1',
        lastError: this.stringifyError(error),
      })
      .where('"eventId" = :eventId', { eventId: event.metadata.eventId })
      .execute();
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`.slice(0, 2000);
    }
    return String(error).slice(0, 2000);
  }
}
