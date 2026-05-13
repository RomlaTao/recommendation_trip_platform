import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
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
  ) {}

  async execute(command: UpdateTripItemCommand): Promise<void> {
    const trip = await this.tripRepository.findById(command.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    if (trip.toSnapshot().userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
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
