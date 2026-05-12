import { Injectable, Logger } from '@nestjs/common';

import { TripDomainEvent } from '../../domain/events/trip.events.js';
import { TripEventBusPort } from '../../application/ports/trip-event-bus.port.js';

@Injectable()
export class NoopTripEventBusAdapter implements TripEventBusPort {
  private readonly logger = new Logger(NoopTripEventBusAdapter.name);

  async publish(events: TripDomainEvent[]): Promise<void> {
    if (!events.length) return;

    for (const event of events) {
      this.logger.debug(
        `[trip-event] ${event.metadata.eventType} aggregateId=${event.metadata.aggregateId}`,
      );
    }
  }
}
