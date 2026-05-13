import { Inject, Injectable } from '@nestjs/common';
import { TRIP_REPOSITORY } from '../../../trip.di-tokens.js';
import type { TripRepositoryPort } from '../../ports/trip.repository.port.js';
import {
  ListMyTripsHandler,
  ListMyTripsQuery,
} from '../handles/list-my-trips.handler.js';
import type { TripAggregate } from '../../../domain/aggregates/trip.aggregate.js';

@Injectable()
export class ListMyTripsHandlerImpl implements ListMyTripsHandler {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: ListMyTripsQuery): Promise<TripAggregate[]> {
    return this.tripRepository.findByUserId(input);
  }
}
