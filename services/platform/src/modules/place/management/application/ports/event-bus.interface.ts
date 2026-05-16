import { DomainEvent } from '../../domain/events/place-management.events.js';

export interface PlaceManagementEventBusPort {
  publish(events: DomainEvent[]): Promise<void>;
}
