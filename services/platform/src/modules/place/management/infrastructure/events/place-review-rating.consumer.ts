import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import {
  APPLY_REVIEW_EVENT_JOB,
  PLACE_RATING_SNAPSHOT_QUEUE,
  PlaceReviewDomainEvent,
} from '../../../shared/events/place-review.events.js';
import { ApplyReviewToPlaceRatingUseCase } from '../../application/use-cases/apply-review-to-place-rating.use-case.js';
import { BullPlaceRatingUpdatedPublisher } from './bull-place-rating-updated.publisher.js';

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceReviewRatingConsumer {
  constructor(
    private readonly applyReviewToPlaceRating: ApplyReviewToPlaceRatingUseCase,
    private readonly placeRatingUpdatedPublisher: BullPlaceRatingUpdatedPublisher,
  ) {}

  @Process(APPLY_REVIEW_EVENT_JOB)
  async handleApplyReviewEvent(job: any): Promise<void> {
    const typedJob = job as { data: PlaceReviewDomainEvent };
    const ratingUpdatedEvent = await this.applyReviewToPlaceRating.execute(
      typedJob.data,
    );
    await this.placeRatingUpdatedPublisher.publish(ratingUpdatedEvent);
  }
}
