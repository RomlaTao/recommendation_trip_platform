import { randomUUID } from 'node:crypto';

import { TripStatus } from '../enums/trip-status.enum.js';

export interface TripDomainEventMetadata {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateType: 'TRIP';
  aggregateId: string;
  occurredAt: Date;
}

export interface TripDomainEvent {
  readonly metadata: TripDomainEventMetadata;
}

abstract class BaseTripDomainEvent implements TripDomainEvent {
  readonly metadata: TripDomainEventMetadata;

  protected constructor(eventType: string, aggregateId: string, eventVersion = 1) {
    this.metadata = {
      eventId: randomUUID(),
      eventType,
      eventVersion,
      aggregateType: 'TRIP',
      aggregateId,
      occurredAt: new Date(),
    };
  }
}

export class TripDraftCreatedEvent extends BaseTripDomainEvent {
  constructor(
    public readonly tripId: string,
    public readonly userId: string,
    public readonly status: TripStatus,
  ) {
    super('TripDraftCreatedEvent', tripId);
  }
}
