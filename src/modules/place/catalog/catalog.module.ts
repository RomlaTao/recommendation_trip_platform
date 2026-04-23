import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PLACE_CATALOG_REPOSITORY } from './application/catalog.di-tokens.js';
import { PlaceCatalogService } from './application/services/place-catalog.service.js';
import { PlaceRatingSnapshotService } from './application/services/place-rating-snapshot.service.js';
import { PlaceCatalogRepository } from './infrastructure/persistence/typeorm/place-catalog.repository.js';
import { PlaceManagementModule } from '../management/management.module.js';
import { PlaceCatalogController } from './presentation/controllers/place-catalog.controller.js';
import { NearbyRateLimitGuard } from './presentation/guards/nearby-rate-limit.guard.js';
import { PlaceRatingSnapshotConsumer } from './infrastructure/events/place-rating-snapshot.consumer.js';
import { PlaceRatingSnapshotEventOrmEntity } from './infrastructure/persistence/typeorm/place-rating-snapshot-event.orm-entity.js';
import { PlaceOrmEntity } from '../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PLACE_RATING_SNAPSHOT_QUEUE } from '../shared/events/place-review.events.js';

@Module({
  imports: [
    PlaceManagementModule,
    TypeOrmModule.forFeature([PlaceOrmEntity, PlaceRatingSnapshotEventOrmEntity]),
    BullModule.registerQueue({
      name: PLACE_RATING_SNAPSHOT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [PlaceCatalogController],
  providers: [
    PlaceCatalogService,
    PlaceRatingSnapshotService,
    PlaceRatingSnapshotConsumer,
    NearbyRateLimitGuard,
    {
      provide: PLACE_CATALOG_REPOSITORY,
      useClass: PlaceCatalogRepository,
    },
  ],
  exports: [PLACE_CATALOG_REPOSITORY, PlaceCatalogService, PlaceRatingSnapshotService],
})
export class PlaceCatalogModule {}
