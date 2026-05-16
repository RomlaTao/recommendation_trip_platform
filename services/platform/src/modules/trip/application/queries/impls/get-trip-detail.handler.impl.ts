import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  GetTripDetailHandler,
  GetTripDetailQuery,
} from '../handles/get-trip-detail.handler.js';
import type { TripAggregateSnapshot } from '../../../domain/aggregates/trip.aggregate.js';

@Injectable()
export class GetTripDetailHandlerImpl implements GetTripDetailHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: GetTripDetailQuery): Promise<TripAggregateSnapshot> {
    const trip = await this.tripRepository.findById(input.tripId);

    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== input.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    return snapshot;
  }
}
