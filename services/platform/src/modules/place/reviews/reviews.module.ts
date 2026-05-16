import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceOrmEntity } from '../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PLACE_RATING_SNAPSHOT_QUEUE } from '../shared/events/place-review.events.js';
import { PLACE_REVIEW_EVENT_PUBLISHER } from './application/reviews.di-tokens.js';
import { PlaceReviewService } from './application/place-review.service.js';
import { BullPlaceReviewEventPublisher } from './infrastructure/events/bull-place-review-event.publisher.js';
import { PlaceReviewRepository } from './infrastructure/persistence/typeorm/place-review.repository.js';
import { PlaceReviewOrmEntity } from './infrastructure/persistence/typeorm/place-review.orm-entity.js';
import { PlaceReviewController } from './presentation/controllers/place-review.controller.js';
import { PlaceReviewAdminController } from './presentation/controllers/place-review-admin.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlaceReviewOrmEntity, PlaceOrmEntity]),
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
    PlaceReviewService,
    PlaceReviewRepository,
  ],
  controllers: [PlaceReviewController, PlaceReviewAdminController],
  exports: [PLACE_REVIEW_EVENT_PUBLISHER, BullModule, PlaceReviewService],
})
export class PlaceReviewsModule {}
