import { PlaceRatingUpdatedDomainEvent } from '../../../shared/events/place-review.events.js';

export interface PlaceRatingSnapshotInboxPort {
  tryStartProcessing(event: PlaceRatingUpdatedDomainEvent): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, error: unknown): Promise<void>;
  markDeadLetter(
    event: PlaceRatingUpdatedDomainEvent,
    error: unknown,
  ): Promise<void>;
}
