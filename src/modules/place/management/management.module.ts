import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerOrmEntity } from './infrastructure/persistence/typeorm/partner.orm-entity.js';
import { PlaceCategoryOrmEntity } from './infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { PlaceOrmEntity } from './infrastructure/persistence/typeorm/place.orm-entity.js';
import { AdminPlaceController } from './presentation/controllers/admin.controller.js';
import { PartnerPlaceController } from './presentation/controllers/partner.controller.js';
import { PLACE_MANAGEMENT_EVENT_BUS, PLACE_MANAGEMENT_REPOSITORY } from './application/management.di-tokens.js';
import { PlaceManagementRepository } from './infrastructure/persistence/typeorm/management.repository.js';
import { PlaceMapper } from './infrastructure/persistence/mappers/place.mapper.js';
import { NestEventBusAdapter } from './infrastructure/events/nest-event-bus.adapter.js';
import { CreatePlaceUseCase } from './application/use-cases/create-place.use-case.js';
import { UpdatePlaceUseCase } from './application/use-cases/update-place.use-case.js';
import { SubmitPlaceUseCase } from './application/use-cases/submit-place.use-case.js';
import { ApprovePlaceUseCase } from './application/use-cases/approve-place.use-case.js';
import { RejectPlaceUseCase } from './application/use-cases/reject-place.use-case.js';
import { DeletePlaceByAdminUseCase } from './application/use-cases/delete-place-by-admin.use-case.js';
import { GetPlaceUseCase } from './application/use-cases/get-place.use-case.js';
import { DeleteOwnPlaceUseCase } from './application/use-cases/delete-own-place.use-case.js';
import { RestorePlaceByAdminUseCase } from './application/use-cases/restore-place-by-admin.use-case.js';
import { RestoreOwnPlaceUseCase } from './application/use-cases/restore-own-place.use-case.js';
import { PLACE_RATING_SNAPSHOT_QUEUE } from '../shared/events/place-review.events.js';
import { PlaceRatingUpdateService } from './application/services/place-rating-update.service.js';
import { BullPlaceRatingUpdatedPublisher } from './infrastructure/events/bull-place-rating-updated.publisher.js';
import { PlaceReviewRatingConsumer } from './infrastructure/events/place-review-rating.consumer.js';
import { PlaceRatingReconciliationScheduler } from './infrastructure/events/place-rating-reconciliation.scheduler.js';

/**
 * Place Management BC — owns persistence for Partner, PlaceCategory, Place.
 * Export `TypeOrmModule` so Catalog/Reviews can inject repositories without re-registering entities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PartnerOrmEntity, PlaceCategoryOrmEntity, PlaceOrmEntity]),
    BullModule.registerQueue({
      name: PLACE_RATING_SNAPSHOT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [AdminPlaceController, PartnerPlaceController],
  providers: [
    PlaceMapper,
    {
      provide: PLACE_MANAGEMENT_REPOSITORY,
      useClass: PlaceManagementRepository,
    },
    {
      provide: PLACE_MANAGEMENT_EVENT_BUS,
      useClass: NestEventBusAdapter,
    },
    CreatePlaceUseCase,
    UpdatePlaceUseCase,
    SubmitPlaceUseCase,
    ApprovePlaceUseCase,
    RejectPlaceUseCase,
    DeletePlaceByAdminUseCase,
    DeleteOwnPlaceUseCase,
    RestorePlaceByAdminUseCase,
    RestoreOwnPlaceUseCase,
    GetPlaceUseCase,
    PlaceRatingUpdateService,
    BullPlaceRatingUpdatedPublisher,
    PlaceReviewRatingConsumer,
    PlaceRatingReconciliationScheduler,
  ],
  exports: [TypeOrmModule, PLACE_MANAGEMENT_REPOSITORY],
})
export class PlaceManagementModule {}
