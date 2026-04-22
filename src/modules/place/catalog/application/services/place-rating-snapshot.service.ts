import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PlaceOrmEntity } from '../../../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PlaceRatingSnapshotEventOrmEntity } from '../../infrastructure/persistence/typeorm/place-rating-snapshot-event.orm-entity.js';
import { PlaceReviewDomainEvent } from '../../../shared/events/place-review.events.js';

@Injectable()
export class PlaceRatingSnapshotService {
  private readonly logger = new Logger(PlaceRatingSnapshotService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
    @InjectRepository(PlaceRatingSnapshotEventOrmEntity)
    private readonly snapshotEventRepository: Repository<PlaceRatingSnapshotEventOrmEntity>,
  ) {}

  async applyReviewEvent(event: PlaceReviewDomainEvent): Promise<void> {
    const inserted = await this.tryStartInboxEvent(event);
    if (!inserted) {
      this.logger.debug(`Skip duplicated review event ${event.metadata.eventId}`);
      return;
    }

    try {
      await this.recalculatePlaceRatingSnapshot(event.payload.placeId);
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

  async markEventDeadLetter(event: PlaceReviewDomainEvent, error: unknown): Promise<void> {
    await this.snapshotEventRepository.update(
      { eventId: event.metadata.eventId },
      {
        status: 'DEAD_LETTER',
        attempts: 5,
        lastError: this.stringifyError(error),
      },
    );
  }

  async reconcile(limit = 100): Promise<number> {
    // Rebuild snapshots for places whose reviews changed after last snapshot timestamp.
    // Use r.updatedAt (including soft-deleted reviews) to recover when delete events were missed.
    const candidates = await this.dataSource.query(
      `
      SELECT p."id"
      FROM "places" p
      WHERE EXISTS (
        SELECT 1
        FROM "place_reviews" r
        WHERE r."placeId" = p."id"
          AND (
            p."ratingLastUpdatedAt" IS NULL
            OR r."updatedAt" > p."ratingLastUpdatedAt"
          )
      )
      LIMIT $1
      `,
      [limit],
    );

    for (const row of candidates as Array<{ id: string }>) {
      await this.recalculatePlaceRatingSnapshot(row.id);
    }

    return candidates.length;
  }

  private async tryStartInboxEvent(event: PlaceReviewDomainEvent): Promise<boolean> {
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

  private async recalculatePlaceRatingSnapshot(placeId: string): Promise<void> {
    const [result] = (await this.dataSource.query(
      `
      SELECT
        AVG(r."rating")::numeric(3,2) AS "averageRating",
        COUNT(1)::int AS "reviewCount"
      FROM "place_reviews" r
      WHERE r."placeId" = $1
        AND r."deletedAt" IS NULL
      `,
      [placeId],
    )) as Array<{ averageRating: string | null; reviewCount: number }>;

    await this.placeRepository
      .createQueryBuilder()
      .update(PlaceOrmEntity)
      .set({
        averageRating: result.averageRating,
        reviewCount: Number(result.reviewCount ?? 0),
        ratingLastUpdatedAt: new Date(),
      })
      .where('"id" = :placeId', { placeId })
      .execute();
  }

  private async markEventFailed(event: PlaceReviewDomainEvent, error: unknown): Promise<void> {
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
