import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlaceRatingUpdatedDomainEvent } from '../../../shared/events/place-review.events.js';
import { PLACE_RATING_SNAPSHOT_INBOX } from '../catalog.di-tokens.js';
import type { PlaceRatingSnapshotInboxPort } from '../ports/place-rating-snapshot-inbox.port.js';

@Injectable()
export class PlaceRatingSnapshotService {
  private readonly logger = new Logger(PlaceRatingSnapshotService.name);

  constructor(
    @Inject(PLACE_RATING_SNAPSHOT_INBOX)
    private readonly inbox: PlaceRatingSnapshotInboxPort,
  ) {}

  async applyPlaceRatingUpdatedEvent(
    event: PlaceRatingUpdatedDomainEvent,
  ): Promise<void> {
    const inserted = await this.inbox.tryStartProcessing(event);
    if (!inserted) {
      this.logger.debug(
        `Skip duplicated place rating updated event ${event.metadata.eventId}`,
      );
      return;
    }

    try {
      await this.inbox.markProcessed(event.metadata.eventId);
    } catch (error) {
      await this.inbox.markFailed(event.metadata.eventId, error);
      throw error;
    }
  }

  async markEventDeadLetter(
    event: PlaceRatingUpdatedDomainEvent,
    error: unknown,
  ): Promise<void> {
    await this.inbox.markDeadLetter(event, error);
  }
}
