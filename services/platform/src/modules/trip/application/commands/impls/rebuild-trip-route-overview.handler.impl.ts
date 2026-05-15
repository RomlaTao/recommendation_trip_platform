import { Inject, Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import { TripRouteOverviewService } from '../../services/trip-route-overview.service.js';
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
    private readonly routeOverviewService: TripRouteOverviewService,
  ) {}

  async execute(command: RebuildTripRouteOverviewCommand) {
    const trip = await this.tripRepository.findById(command.tripId);
    if (!trip) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    const snapshot = trip.toSnapshot();
    if (snapshot.userId !== command.userId) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    return this.routeOverviewService.rebuild(snapshot);
  }
}
