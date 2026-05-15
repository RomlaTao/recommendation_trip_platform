import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import { TripPlaceDestinationValidator } from '../../services/trip-place-destination.validator.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  AddTripItemCommand,
  AddTripItemHandler,
} from '../handles/add-trip-item.handler.js';

@Injectable()
export class AddTripItemHandlerImpl implements AddTripItemHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    private readonly placeDestinationValidator: TripPlaceDestinationValidator,
  ) {}

  async execute(command: AddTripItemCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    await this.placeDestinationValidator.assertPlaceMatchesDestination(
      command.placeId,
      snapshot.destinationId,
    );

    trip.addItem({
      tripDayId: command.dayId,
      placeId: command.placeId,
      type: command.type,
      startTime: command.startTime,
      endTime: command.endTime,
      note: command.note,
      sortOrder: command.sortOrder,
    });

    await this.tripRepository.save(trip);
  }
}
