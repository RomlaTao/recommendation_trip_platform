import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import { UpdateTripDayCommand, UpdateTripDayHandler } from '../handles/update-trip-day.handler.js';

@Injectable()
export class UpdateTripDayHandlerImpl implements UpdateTripDayHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(command: UpdateTripDayCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    trip.updateDay({
      dayId: command.dayId,
      dayIndex: command.dayIndex,
      date: command.date,
    });

    await this.tripRepository.save(trip);
  }
}
