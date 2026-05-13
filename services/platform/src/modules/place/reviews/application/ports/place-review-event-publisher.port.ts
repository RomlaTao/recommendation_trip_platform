import { PlaceReviewDomainEvent } from '../../../shared/events/place-review.events.js';

export interface PlaceReviewEventPublisherPort {
  publish(event: PlaceReviewDomainEvent): Promise<void>;
}
