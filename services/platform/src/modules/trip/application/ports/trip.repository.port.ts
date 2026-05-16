import { TripAggregate } from '../../domain/aggregates/trip.aggregate.js';
import type { TripRouteOverviewSnapshot } from '../../domain/read-models/trip-route-overview.snapshot.js';

export interface TripRepositoryPort {
  save(trip: TripAggregate): Promise<void>;
  findById(id: string): Promise<TripAggregate | null>;
  findByUserId(input: {
    userId: string;
    page: number;
    limit: number;
  }): Promise<TripAggregate[]>;
  findRouteOverviewByTripId(
    tripId: string,
  ): Promise<TripRouteOverviewSnapshot | null>;
  saveRouteOverview(
    tripId: string,
    overview: TripRouteOverviewSnapshot,
  ): Promise<void>;
}
