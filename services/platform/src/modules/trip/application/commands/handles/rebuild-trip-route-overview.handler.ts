import { TripRouteOverviewModel } from '../../models/trip-route-overview.model.js';

export interface RebuildTripRouteOverviewCommand {
  tripId: string;
  userId: string;
}

export abstract class RebuildTripRouteOverviewHandler {
  abstract execute(
    command: RebuildTripRouteOverviewCommand,
  ): Promise<TripRouteOverviewModel>;
}
