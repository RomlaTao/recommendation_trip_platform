import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import type { RabbitMqConfig } from '../../../../../../core/config/rabbitmq.config.js';
import { PlaceMlOutboxWriterService } from '../../../../messaging/place-ml-outbox-writer.service.js';
import type {
  PlaceRatingPersistencePort,
  PlaceRatingSnapshot,
} from '../../../application/ports/place-rating-persistence.port.js';
import { PlaceOrmEntity } from './place.orm-entity.js';

interface PlaceIdRow {
  id: string;
}

interface RatingAggregateRow {
  averageRating: string | null;
  reviewCount: string | number | null;
}

function asPlaceIdRows(rows: unknown): PlaceIdRow[] {
  return rows as PlaceIdRow[];
}

function asRatingAggregateRows(rows: unknown): RatingAggregateRow[] {
  return rows as RatingAggregateRow[];
}

@Injectable()
export class PlaceRatingPersistence implements PlaceRatingPersistencePort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly placeMlOutboxWriter: PlaceMlOutboxWriterService,
    private readonly configService: ConfigService,
  ) {}

  private projectionRoutingKey(): string {
    return (
      this.configService.get<RabbitMqConfig>('rabbitmq')
        ?.placeProjectionRoutingKey ?? 'place.projection.v1'
    );
  }

  async findPlaceIdsNeedingReconcile(limit: number): Promise<string[]> {
    const raw: unknown = await this.dataSource.query(
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
    return asPlaceIdRows(raw).map((row) => row.id);
  }

  async recalculateAndPersist(placeId: string): Promise<PlaceRatingSnapshot> {
    const rk = this.projectionRoutingKey();
    return this.dataSource.transaction(async (manager) => {
      const rawRows: unknown = await manager.query(
        `
        SELECT
          AVG(r."rating")::numeric(3,2) AS "averageRating",
          COUNT(1)::int AS "reviewCount"
        FROM "place_reviews" r
        WHERE r."placeId" = $1
          AND r."deletedAt" IS NULL
        `,
        [placeId],
      );
      const rows = asRatingAggregateRows(rawRows);
      const result = rows[0];

      const snapshot: PlaceRatingSnapshot = {
        placeId,
        averageRating: result?.averageRating ?? null,
        reviewCount: Number(result?.reviewCount ?? 0),
        ratingLastUpdatedAt: new Date(),
      };

      await manager.query(
        `
        UPDATE "places"
        SET
          "averageRating" = $2,
          "reviewCount" = $3,
          "ratingLastUpdatedAt" = $4
        WHERE "id" = $1
        `,
        [
          snapshot.placeId,
          snapshot.averageRating,
          snapshot.reviewCount,
          snapshot.ratingLastUpdatedAt,
        ],
      );

      const place = await manager.findOne(PlaceOrmEntity, {
        where: { id: placeId },
        withDeleted: true,
      });
      if (place) {
        await this.placeMlOutboxWriter.enqueueProjectionFromPlace(
          manager,
          place,
          rk,
        );
      }

      return snapshot;
    });
  }
}
