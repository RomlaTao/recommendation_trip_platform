import { randomUUID } from 'node:crypto';

export interface DomainEventMetadata {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateType: 'PLACE_MANAGEMENT';
  aggregateId: string;
  occurredAt: Date;
}

export interface DomainEvent {
  readonly metadata: DomainEventMetadata;
}

abstract class BasePlaceManagementEvent implements DomainEvent {
  readonly metadata: DomainEventMetadata;

  protected constructor(eventType: string, aggregateId: string, eventVersion = 1) {
    this.metadata = {
      eventId: randomUUID(),
      eventType,
      eventVersion,
      aggregateType: 'PLACE_MANAGEMENT',
      aggregateId,
      occurredAt: new Date(),
    };
  }
}

export class PlaceSubmittedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceSubmittedEvent', placeId);
  }
}

export class PlaceRegistrationRequestSubmittedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly requestId: string,
    public readonly requesterUserId: string,
    public readonly placeName: string,
  ) {
    super('PlaceRegistrationRequestSubmittedEvent', requestId);
  }
}

export class PlaceApprovedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceApprovedEvent', placeId);
  }
}

export class PlaceRejectedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
    public readonly reason: string,
  ) {
    super('PlaceRejectedEvent', placeId);
  }
}

export class PlaceDeletedByOwnerEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceDeletedByOwnerEvent', placeId);
  }
}

export class PlaceDeletedByAdminEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
    public readonly reason: string,
  ) {
    super('PlaceDeletedByAdminEvent', placeId);
  }
}

export class PlaceRestoredByOwnerEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceRestoredByOwnerEvent', placeId);
  }
}

export class PlaceRestoredByAdminEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceRestoredByAdminEvent', placeId);
  }
}
