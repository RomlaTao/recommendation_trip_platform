import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import { PlaceOrmEntity } from '../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import {
  PLACE_ML_AGGREGATE_TYPE,
  PLACE_ML_PROJECTION_EVENT_TYPE,
  PLACE_ML_PROJECTION_SCHEMA_VERSION,
} from './place-ml-projection.constants.js';
import { PlaceMlOutboxOrmEntity } from './place-ml-outbox.orm-entity.js';

export interface PlaceMlProjectionPayload {
  schemaVersion: typeof PLACE_ML_PROJECTION_SCHEMA_VERSION;
  eventId: string;
  eventType: typeof PLACE_ML_PROJECTION_EVENT_TYPE;
  occurredAt: string;
  place: {
    id: string;
    lat: number;
    lng: number;
    categoryId: string;
    destinationId: string | null;
    averageRating: string | null;
    reviewCount: number;
    catalogStatus: string;
    tagScores: Record<string, number> | null;
    deletedAt: string | null;
  };
}

@Injectable()
export class PlaceMlOutboxWriterService {
  buildProjectionPayload(place: PlaceOrmEntity): PlaceMlProjectionPayload {
    const deletedAt = place.deletedAt
      ? new Date(place.deletedAt).toISOString()
      : null;
    return {
      schemaVersion: PLACE_ML_PROJECTION_SCHEMA_VERSION,
      eventId: randomUUID(),
      eventType: PLACE_ML_PROJECTION_EVENT_TYPE,
      occurredAt: new Date().toISOString(),
      place: {
        id: place.id,
        lat: Number.parseFloat(String(place.lat)),
        lng: Number.parseFloat(String(place.lng)),
        categoryId: place.categoryId,
        destinationId: place.destinationId ?? null,
        averageRating: place.averageRating ?? null,
        reviewCount: place.reviewCount ?? 0,
        catalogStatus: place.status,
        tagScores: place.tagScores ?? null,
        deletedAt,
      },
    };
  }

  /**
   * Inserts one outbox row in the same DB transaction as the calling persistence
   * (per ml-model-service README §7.1).
   */
  async enqueueProjectionFromPlace(
    manager: EntityManager,
    place: PlaceOrmEntity,
    routingKey: string,
  ): Promise<void> {
    const payload = this.buildProjectionPayload(place);
    const row = manager.create(PlaceMlOutboxOrmEntity, {
      aggregateType: PLACE_ML_AGGREGATE_TYPE,
      aggregateId: place.id,
      eventId: payload.eventId,
      eventType: PLACE_ML_PROJECTION_EVENT_TYPE,
      routingKey,
      payload: payload as unknown as Record<string, unknown>,
      status: 'PENDING',
      publishedAt: null,
      lastError: null,
      attemptCount: 0,
    });
    await manager.save(PlaceMlOutboxOrmEntity, row);
  }
}
