import { Inject, Injectable } from '@nestjs/common';
import {
  createPlaceRatingUpdatedEvent,
  PlaceRatingUpdatedDomainEvent,
  PlaceReviewDomainEvent,
} from '../../../shared/events/place-review.events.js';
import { PLACE_RATING_PERSISTENCE } from '../management.di-tokens.js';
import type { PlaceRatingPersistencePort } from '../ports/place-rating-persistence.port.js';

@Injectable()
export class ApplyReviewToPlaceRatingUseCase {
  constructor(
    @Inject(PLACE_RATING_PERSISTENCE)
    private readonly placeRatingPersistence: PlaceRatingPersistencePort,
  ) {}

  async execute(
    event: PlaceReviewDomainEvent,
  ): Promise<PlaceRatingUpdatedDomainEvent> {
    const snapshot = await this.placeRatingPersistence.recalculateAndPersist(
      event.payload.placeId,
    );
    return createPlaceRatingUpdatedEvent({
      ...snapshot,
      sourceReviewEventId: event.metadata.eventId,
    });
  }
}
