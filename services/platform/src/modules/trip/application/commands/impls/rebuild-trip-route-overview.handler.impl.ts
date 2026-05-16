import { Inject, Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import {
  TRIP_PLACE_READ_PORT,
  TRIP_REPOSITORY,
} from '../../../trip.di-tokens.js';
import { TripRouteOverviewBuilder } from '../../../domain/services/trip-route-overview.builder.js';
import type { TripPlaceReadPort } from '../../ports/trip-place-read.port.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import type { TripRouteOverviewSnapshot } from '../../../domain/read-models/trip-route-overview.snapshot.js';
import {
  RebuildTripRouteOverviewCommand,
  RebuildTripRouteOverviewHandler,
} from '../handles/rebuild-trip-route-overview.handler.js';

@Injectable()
export class RebuildTripRouteOverviewHandlerImpl
  implements RebuildTripRouteOverviewHandler
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_PLACE_READ_PORT)
    private readonly tripPlaceRead: TripPlaceReadPort,
  ) {}

  async execute(
    command: RebuildTripRouteOverviewCommand,
  ): Promise<TripRouteOverviewSnapshot> {
    const trip = await this.tripRepository.findById(command.tripId);
    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const placeIds = new Set<string>();
    for (const day of snapshot.days) {
      for (const item of day.toSnapshot().items) {
        placeIds.add(item.placeId);
      }
    }

    const places = await this.tripPlaceRead.findApprovedRoutePlaces([
      ...placeIds,
    ]);
    const overview = TripRouteOverviewBuilder.build(snapshot, places);
    await this.tripRepository.saveRouteOverview(snapshot.id, overview);
    return overview;
  }
}
