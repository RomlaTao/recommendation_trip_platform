import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import { TripPlaceDestinationValidator } from '../../services/trip-place-destination.validator.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  UpdateTripItemCommand,
  UpdateTripItemHandler,
} from '../handles/update-trip-item.handler.js';

@Injectable()
export class UpdateTripItemHandlerImpl implements UpdateTripItemHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    private readonly placeDestinationValidator: TripPlaceDestinationValidator,
  ) {}

  async execute(command: UpdateTripItemCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (command.placeId) {
      await this.placeDestinationValidator.assertPlaceMatchesDestination(
        command.placeId,
        snapshot.destinationId,
      );
    }

    trip.updateItem({
      tripDayId: command.dayId,
      itemId: command.itemId,
      placeId: command.placeId,
      type: command.type,
      note: command.note,
      sortOrder: command.sortOrder,
    });

    await this.tripRepository.save(trip);
  }
}
