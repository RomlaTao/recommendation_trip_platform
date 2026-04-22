import { randomUUID } from 'node:crypto';

export const PLACE_RATING_SNAPSHOT_QUEUE = 'place-rating-snapshot';
export const APPLY_REVIEW_EVENT_JOB = 'apply-review-event';
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

export type PlaceReviewEventPayload = ReviewCreatedEvent | ReviewUpdatedEvent | ReviewDeletedEvent;

export interface PlaceReviewDomainEvent<TPayload extends PlaceReviewEventPayload = PlaceReviewEventPayload> {
  metadata: PlaceReviewEventMetadata;
  payload: TPayload;
}

export function createReviewCreatedEvent(payload: ReviewCreatedEvent): PlaceReviewDomainEvent<ReviewCreatedEvent> {
  return {
    metadata: createMetadata('ReviewCreated', payload.reviewId),
    payload,
  };
}

export function createReviewUpdatedEvent(payload: ReviewUpdatedEvent): PlaceReviewDomainEvent<ReviewUpdatedEvent> {
  return {
    metadata: createMetadata('ReviewUpdated', payload.reviewId),
    payload,
  };
}

export function createReviewDeletedEvent(payload: ReviewDeletedEvent): PlaceReviewDomainEvent<ReviewDeletedEvent> {
  return {
    metadata: createMetadata('ReviewDeleted', payload.reviewId),
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
