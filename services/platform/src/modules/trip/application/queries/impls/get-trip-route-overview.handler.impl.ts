import { Inject, Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  GetTripRouteOverviewHandler,
  GetTripRouteOverviewQuery,
} from '../handles/get-trip-route-overview.handler.js';
import type { TripRouteOverviewSnapshot } from '../../../domain/read-models/trip-route-overview.snapshot.js';

@Injectable()
export class GetTripRouteOverviewHandlerImpl
  implements GetTripRouteOverviewHandler
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    query: GetTripRouteOverviewQuery,
  ): Promise<TripRouteOverviewSnapshot | null> {
    const trip = await this.tripRepository.findById(query.tripId);
    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== query.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    return this.tripRepository.findRouteOverviewByTripId(query.tripId);
  }
}
