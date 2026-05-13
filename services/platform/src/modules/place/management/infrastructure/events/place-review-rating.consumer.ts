import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import {
  APPLY_REVIEW_EVENT_JOB,
  PLACE_RATING_SNAPSHOT_QUEUE,
  PlaceReviewDomainEvent,
} from '../../../shared/events/place-review.events.js';
import { PlaceRatingUpdateService } from '../../application/services/place-rating-update.service.js';
import { BullPlaceRatingUpdatedPublisher } from './bull-place-rating-updated.publisher.js';

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceReviewRatingConsumer {
  constructor(
    private readonly placeRatingUpdateService: PlaceRatingUpdateService,
    private readonly placeRatingUpdatedPublisher: BullPlaceRatingUpdatedPublisher,
  ) {}

  @Process(APPLY_REVIEW_EVENT_JOB)
  async handleApplyReviewEvent(job: any): Promise<void> {
    const typedJob = job as { data: PlaceReviewDomainEvent };
    const ratingUpdatedEvent =
      await this.placeRatingUpdateService.applyReviewEvent(typedJob.data);
    await this.placeRatingUpdatedPublisher.publish(ratingUpdatedEvent);
  }
}
