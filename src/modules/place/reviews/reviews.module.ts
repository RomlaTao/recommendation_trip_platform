import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PLACE_RATING_SNAPSHOT_QUEUE } from '../shared/events/place-review.events.js';
import { PLACE_REVIEW_EVENT_PUBLISHER } from './application/reviews.di-tokens.js';
import { BullPlaceReviewEventPublisher } from './infrastructure/events/bull-place-review-event.publisher.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PLACE_RATING_SNAPSHOT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  providers: [
    {
      provide: PLACE_REVIEW_EVENT_PUBLISHER,
      useClass: BullPlaceReviewEventPublisher,
    },
  ],
  exports: [PLACE_REVIEW_EVENT_PUBLISHER, BullModule],
})
export class PlaceReviewsModule {}
