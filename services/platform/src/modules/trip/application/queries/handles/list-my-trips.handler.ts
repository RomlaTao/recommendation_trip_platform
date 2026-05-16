import type { TripAggregate } from '../../../domain/aggregates/trip.aggregate.js';

export interface ListMyTripsQuery {
  userId: string;
  page: number;
  limit: number;
}

export abstract class ListMyTripsHandler {
  abstract execute(input: ListMyTripsQuery): Promise<TripAggregate[]>;
}
