import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  createPlaceRatingUpdatedEvent,
  PlaceRatingUpdatedDomainEvent,
  PlaceReviewDomainEvent,
} from '../../../shared/events/place-review.events.js';

export interface PlaceRatingSnapshot {
  placeId: string;
  averageRating: string | null;
  reviewCount: number;
  ratingLastUpdatedAt: Date;
}

@Injectable()
export class PlaceRatingUpdateService {
  constructor(private readonly dataSource: DataSource) {}

  async applyReviewEvent(event: PlaceReviewDomainEvent): Promise<PlaceRatingUpdatedDomainEvent> {
    const snapshot = await this.recalculateAndPersist(event.payload.placeId);
    return createPlaceRatingUpdatedEvent({
      ...snapshot,
      sourceReviewEventId: event.metadata.eventId,
    });
  }

  async reconcile(limit = 100): Promise<PlaceRatingSnapshot[]> {
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

    const snapshots: PlaceRatingSnapshot[] = [];
    for (const row of candidates as Array<{ id: string }>) {
      const snapshot = await this.recalculateAndPersist(row.id);
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  private async recalculateAndPersist(placeId: string): Promise<PlaceRatingSnapshot> {
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

    const snapshot: PlaceRatingSnapshot = {
      placeId,
      averageRating: result?.averageRating ?? null,
      reviewCount: Number(result?.reviewCount ?? 0),
      ratingLastUpdatedAt: new Date(),
    };

    await this.dataSource.query(
      `
      UPDATE "places"
      SET
        "averageRating" = $2,
        "reviewCount" = $3,
        "ratingLastUpdatedAt" = $4
      WHERE "id" = $1
      `,
      [snapshot.placeId, snapshot.averageRating, snapshot.reviewCount, snapshot.ratingLastUpdatedAt],
    );

    return snapshot;
  }
}
