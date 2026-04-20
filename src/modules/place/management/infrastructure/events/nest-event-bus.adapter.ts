import { Injectable, Logger } from '@nestjs/common';
import { PlaceManagementEventBusPort } from '../../application/ports/event-bus.interface.js';
import { DomainEvent } from '../../domain/events/place-management.events.js';

@Injectable()
export class NestEventBusAdapter implements PlaceManagementEventBusPort {
  private readonly logger = new Logger(NestEventBusAdapter.name);

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // Lightweight event publishing for now; can be replaced by outbox/message bus later.
      this.logger.log(
        `Published domain event: ${event.metadata.eventType} (id=${event.metadata.eventId}, aggregate=${event.metadata.aggregateType}:${event.metadata.aggregateId})`,
      );
    }
  }
}
