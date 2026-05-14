import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerOrmEntity } from './infrastructure/persistence/typeorm/partner.orm-entity.js';
import { PlaceCategoryOrmEntity } from './infrastructure/persistence/typeorm/place-category.orm-entity.js';
import { PlaceOrmEntity } from './infrastructure/persistence/typeorm/place.orm-entity.js';
import { AdminPlaceController } from './presentation/controllers/admin.controller.js';
import { PartnerPlaceController } from './presentation/controllers/partner.controller.js';
import { UserPlaceController } from './presentation/controllers/user.controller.js';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from './application/management.di-tokens.js';
import { PlaceManagementRepository } from './infrastructure/persistence/typeorm/management.repository.js';
import { PlaceMapper } from './infrastructure/persistence/mappers/place.mapper.js';
import { NestEventBusAdapter } from './infrastructure/events/nest-event-bus.adapter.js';
import { UpdatePlaceUseCase } from './application/use-cases/update-place.use-case.js';
import { SubmitPlaceUseCase } from './application/use-cases/submit-place.use-case.js';
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
import { NotificationModule } from '../../notification/notification.module.js';
import { PlaceRegistrationRequestOrmEntity } from './infrastructure/persistence/typeorm/place-registration-request.orm-entity.js';
import { User } from '../../user/entities/user.entity.js';
import { Role } from '../../permission/entities/role.entity.js';
import { UserRole } from '../../permission/entities/user-role.entity.js';
import { CreatePlaceRegistrationRequestUseCase } from './application/use-cases/create-place-registration-request.use-case.js';
import { ListMyPlaceRegistrationRequestsUseCase } from './application/use-cases/list-my-place-registration-requests.use-case.js';
import { GetMyPlaceRegistrationRequestUseCase } from './application/use-cases/get-my-place-registration-request.use-case.js';
import { ListPlaceRegistrationRequestsForAdminUseCase } from './application/use-cases/list-place-registration-requests-for-admin.use-case.js';
import { ApprovePlaceRegistrationRequestUseCase } from './application/use-cases/approve-place-registration-request.use-case.js';
import { RejectPlaceRegistrationRequestUseCase } from './application/use-cases/reject-place-registration-request.use-case.js';
import { PlaceMlMessagingModule } from '../messaging/place-ml-messaging.module.js';

/**
 * Place Management BC — owns persistence for Partner, PlaceCategory, Place.
 * Export `TypeOrmModule` so Catalog/Reviews can inject repositories without re-registering entities.
 */
@Module({
  imports: [
    NotificationModule,
    PlaceMlMessagingModule,
    TypeOrmModule.forFeature([
      PartnerOrmEntity,
      PlaceCategoryOrmEntity,
      PlaceOrmEntity,
      PlaceRegistrationRequestOrmEntity,
      User,
      Role,
      UserRole,
    ]),
    BullModule.registerQueue({
      name: PLACE_RATING_SNAPSHOT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [
    AdminPlaceController,
    PartnerPlaceController,
    UserPlaceController,
  ],
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
    UpdatePlaceUseCase,
    SubmitPlaceUseCase,
    DeletePlaceByAdminUseCase,
    DeleteOwnPlaceUseCase,
    RestorePlaceByAdminUseCase,
    RestoreOwnPlaceUseCase,
    GetPlaceUseCase,
    PlaceRatingUpdateService,
    BullPlaceRatingUpdatedPublisher,
    PlaceReviewRatingConsumer,
    PlaceRatingReconciliationScheduler,
    CreatePlaceRegistrationRequestUseCase,
    ListMyPlaceRegistrationRequestsUseCase,
    GetMyPlaceRegistrationRequestUseCase,
    ListPlaceRegistrationRequestsForAdminUseCase,
    ApprovePlaceRegistrationRequestUseCase,
    RejectPlaceRegistrationRequestUseCase,
  ],
  exports: [TypeOrmModule, PLACE_MANAGEMENT_REPOSITORY],
})
export class PlaceManagementModule {}
