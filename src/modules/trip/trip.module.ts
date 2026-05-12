import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripController } from './presentation/controllers/trip.controller.js';
import { AddTripDayHandler } from './application/commands/handles/add-trip-day.handler.js';
import { CreateDraftTripHandler } from './application/commands/handles/create-draft-trip.handler.js';
import { AddTripItemHandler } from './application/commands/handles/add-trip-item.handler.js';
import { GetTripDetailHandler } from './application/queries/handles/get-trip-detail.handler.js';
import { ListMyTripsHandler } from './application/queries/handles/list-my-trips.handler.js';
import { RemoveTripDayHandler } from './application/commands/handles/remove-trip-day.handler.js';
import { RemoveTripItemHandler } from './application/commands/handles/remove-trip-item.handler.js';
import { RescheduleTripItemHandler } from './application/commands/handles/reschedule-trip-item.handler.js';
import { UpdateTripDayHandler } from './application/commands/handles/update-trip-day.handler.js';
import { UpdateTripItemHandler } from './application/commands/handles/update-trip-item.handler.js';
import { AddTripDayHandlerImpl } from './application/commands/impls/add-trip-day.handler.impl.js';
import { CreateDraftTripHandlerImpl } from './application/commands/impls/create-draft-trip.handler.impl.js';
import { AddTripItemHandlerImpl } from './application/commands/impls/add-trip-item.handler.impl.js';
import { GetTripDetailHandlerImpl } from './application/queries/impls/get-trip-detail.handler.impl.js';
import { ListMyTripsHandlerImpl } from './application/queries/impls/list-my-trips.handler.impl.js';
import { RemoveTripDayHandlerImpl } from './application/commands/impls/remove-trip-day.handler.impl.js';
import { RemoveTripItemHandlerImpl } from './application/commands/impls/remove-trip-item.handler.impl.js';
import { RescheduleTripItemHandlerImpl } from './application/commands/impls/reschedule-trip-item.handler.impl.js';
import { UpdateTripDayHandlerImpl } from './application/commands/impls/update-trip-day.handler.impl.js';
import { UpdateTripItemHandlerImpl } from './application/commands/impls/update-trip-item.handler.impl.js';
import { TRIP_EVENT_BUS, TRIP_REPOSITORY } from './trip.di-tokens.js';
import { NoopTripEventBusAdapter } from './infrastructure/events/noop-trip-event-bus.adapter.js';
import { TripMapper } from './infrastructure/persistence/mappers/trip.mapper.js';
import { TypeormTripRepository } from './infrastructure/persistence/repositories/typeorm-trip.repository.js';
import { TripDayOrmEntity } from './infrastructure/persistence/typeorm/trip-day.orm-entity.js';
import { TripItemOrmEntity } from './infrastructure/persistence/typeorm/trip-item.orm-entity.js';
import { TripOrmEntity } from './infrastructure/persistence/typeorm/trip.orm-entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TripOrmEntity, TripDayOrmEntity, TripItemOrmEntity])],
  controllers: [TripController],
  providers: [
    TripMapper,
    {
      provide: CreateDraftTripHandler,
      useClass: CreateDraftTripHandlerImpl,
    },
    {
      provide: ListMyTripsHandler,
      useClass: ListMyTripsHandlerImpl,
    },
    {
      provide: GetTripDetailHandler,
      useClass: GetTripDetailHandlerImpl,
    },
    {
      provide: AddTripDayHandler,
      useClass: AddTripDayHandlerImpl,
    },
    {
      provide: UpdateTripDayHandler,
      useClass: UpdateTripDayHandlerImpl,
    },
    {
      provide: RemoveTripDayHandler,
      useClass: RemoveTripDayHandlerImpl,
    },
    {
      provide: AddTripItemHandler,
      useClass: AddTripItemHandlerImpl,
    },
    {
      provide: UpdateTripItemHandler,
      useClass: UpdateTripItemHandlerImpl,
    },
    {
      provide: RescheduleTripItemHandler,
      useClass: RescheduleTripItemHandlerImpl,
    },
    {
      provide: RemoveTripItemHandler,
      useClass: RemoveTripItemHandlerImpl,
    },
    {
      provide: TRIP_REPOSITORY,
      useClass: TypeormTripRepository,
    },
    {
      provide: TRIP_EVENT_BUS,
      useClass: NoopTripEventBusAdapter,
    },
  ],
  exports: [CreateDraftTripHandler, TRIP_REPOSITORY, TRIP_EVENT_BUS],
})
export class TripModule {}
