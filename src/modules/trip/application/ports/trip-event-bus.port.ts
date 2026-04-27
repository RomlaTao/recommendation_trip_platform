import { TripDomainEvent } from '../../domain/events/trip.events.js';

export interface TripEventBusPort {
  publish(events: TripDomainEvent[]): Promise<void>;
}
