import type { TripRouteOverviewSnapshot } from '../../../domain/read-models/trip-route-overview.snapshot.js';

export interface RebuildTripRouteOverviewCommand {
  tripId: string;
  userId: string;
}

export abstract class RebuildTripRouteOverviewHandler {
  abstract execute(
    command: RebuildTripRouteOverviewCommand,
  ): Promise<TripRouteOverviewSnapshot>;
}
