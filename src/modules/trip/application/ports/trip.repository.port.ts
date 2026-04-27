import { TripAggregate } from '../../domain/aggregates/trip.aggregate.js';

export interface TripRepositoryPort {
  save(trip: TripAggregate): Promise<void>;
  findById(id: string): Promise<TripAggregate | null>;
  findByUserId(input: { userId: string; page: number; limit: number }): Promise<TripAggregate[]>;
}
