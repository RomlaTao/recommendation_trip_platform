import type { TripAggregateSnapshot } from '../../../domain/aggregates/trip.aggregate.js';

export interface GetTripDetailQuery {
  tripId: string;
  userId: string;
}

export abstract class GetTripDetailHandler {
  abstract execute(input: GetTripDetailQuery): Promise<TripAggregateSnapshot>;
}
