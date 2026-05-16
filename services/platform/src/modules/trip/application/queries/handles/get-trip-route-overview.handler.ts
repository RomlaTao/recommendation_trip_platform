import type { TripRouteOverviewSnapshot } from '../../../domain/read-models/trip-route-overview.snapshot.js';

export interface GetTripRouteOverviewQuery {
  tripId: string;
  userId: string;
}

export abstract class GetTripRouteOverviewHandler {
  abstract execute(
    query: GetTripRouteOverviewQuery,
  ): Promise<TripRouteOverviewSnapshot | null>;
}
