import { randomUUID } from 'node:crypto';

export const PLACE_RATING_SNAPSHOT_QUEUE = 'place-rating-snapshot';
export const APPLY_REVIEW_EVENT_JOB = 'apply-review-event';
export const APPLY_PLACE_RATING_UPDATED_JOB = 'apply-place-rating-updated';
export const RECONCILE_RATING_SNAPSHOT_JOB = 'reconcile-rating-snapshot';

export interface PlaceReviewEventMetadata {
  eventId: string;
  eventType: 'ReviewCreated' | 'ReviewUpdated' | 'ReviewDeleted';
  eventVersion: number;
  aggregateType: 'PLACE_REVIEW';
  aggregateId: string;
  occurredAt: Date;
}

interface BaseReviewEventPayload {
  reviewId: string;
  placeId: string;
  userId: string;
}

export interface ReviewCreatedEvent extends BaseReviewEventPayload {
  rating: number;
}

export interface ReviewUpdatedEvent extends BaseReviewEventPayload {
  oldRating: number;
  newRating: number;
}

export interface ReviewDeletedEvent extends BaseReviewEventPayload {
  rating: number;
}

export type PlaceReviewEventPayload =
  | ReviewCreatedEvent
  | ReviewUpdatedEvent
  | ReviewDeletedEvent;

export interface PlaceReviewDomainEvent<
  TPayload extends PlaceReviewEventPayload = PlaceReviewEventPayload,
> {
  metadata: PlaceReviewEventMetadata;
  payload: TPayload;
}

export interface PlaceRatingUpdatedEventMetadata {
  eventId: string;
  eventType: 'PlaceRatingUpdated';
  eventVersion: number;
  aggregateType: 'PLACE';
  aggregateId: string;
  occurredAt: Date;
}

export interface PlaceRatingUpdatedEventPayload {
  placeId: string;
  averageRating: string | null;
  reviewCount: number;
  ratingLastUpdatedAt: Date;
  sourceReviewEventId?: string;
}

export interface PlaceRatingUpdatedDomainEvent {
  metadata: PlaceRatingUpdatedEventMetadata;
  payload: PlaceRatingUpdatedEventPayload;
}

export function createReviewCreatedEvent(
  payload: ReviewCreatedEvent,
): PlaceReviewDomainEvent<ReviewCreatedEvent> {
  return {
    metadata: createMetadata('ReviewCreated', payload.reviewId),
    payload,
  };
}

export function createReviewUpdatedEvent(
  payload: ReviewUpdatedEvent,
): PlaceReviewDomainEvent<ReviewUpdatedEvent> {
  return {
    metadata: createMetadata('ReviewUpdated', payload.reviewId),
    payload,
  };
}

export function createReviewDeletedEvent(
  payload: ReviewDeletedEvent,
): PlaceReviewDomainEvent<ReviewDeletedEvent> {
  return {
    metadata: createMetadata('ReviewDeleted', payload.reviewId),
    payload,
  };
}

export function createPlaceRatingUpdatedEvent(
  payload: PlaceRatingUpdatedEventPayload,
): PlaceRatingUpdatedDomainEvent {
  return {
    metadata: {
      eventId: randomUUID(),
      eventType: 'PlaceRatingUpdated',
      eventVersion: 1,
      aggregateType: 'PLACE',
      aggregateId: payload.placeId,
      occurredAt: new Date(),
    },
    payload,
  };
}

function createMetadata(
  eventType: PlaceReviewEventMetadata['eventType'],
  aggregateId: string,
): PlaceReviewEventMetadata {
  return {
    eventId: randomUUID(),
    eventType,
    eventVersion: 1,
    aggregateType: 'PLACE_REVIEW',
    aggregateId,
    occurredAt: new Date(),
  };
}
