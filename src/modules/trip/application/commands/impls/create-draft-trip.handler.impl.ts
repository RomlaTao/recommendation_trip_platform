import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { TRIP_EVENT_BUS, TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import { TripAggregate } from '../../../domain/aggregates/trip.aggregate.js';
import { TripDraftCreatedEvent } from '../../../domain/events/trip.events.js';
import type { TripEventBusPort } from '../../ports/trip-event-bus.port.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  CreateDraftTripCommand,
  CreateDraftTripHandler,
  CreateDraftTripResult,
} from '../handles/create-draft-trip.handler.js';

@Injectable()
export class CreateDraftTripHandlerImpl implements CreateDraftTripHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_EVENT_BUS)
    private readonly eventBus: TripEventBusPort,
  ) {}

  async execute(command: CreateDraftTripCommand): Promise<CreateDraftTripResult> {
    const trip = TripAggregate.create({
      userId: command.userId,
      title: command.title,
      startDate: command.startDate,
      endDate: command.endDate,
    });

    for (const day of command.days) {
      const tripDayId = randomUUID();
      trip.addDay({
        id: tripDayId,
        dayIndex: day.dayIndex,
        date: day.date,
      });

      for (const item of day.items) {
        trip.addItem({
          tripDayId,
          placeId: item.placeId,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime,
          note: item.note,
          sortOrder: item.sortOrder,
        });
      }
    }

    await this.tripRepository.save(trip);
    await this.eventBus.publish([new TripDraftCreatedEvent(trip.id, command.userId, trip.status)]);

    return { id: trip.id };
  }
}
