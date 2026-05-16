import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  RescheduleTripItemCommand,
  RescheduleTripItemHandler,
} from '../handles/reschedule-trip-item.handler.js';

@Injectable()
export class RescheduleTripItemHandlerImpl implements RescheduleTripItemHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(command: RescheduleTripItemCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    trip.rescheduleItem({
      tripDayId: command.dayId,
      itemId: command.itemId,
      startTime: command.startTime,
      endTime: command.endTime,
    });

    await this.tripRepository.save(trip);
  }
}
