import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import {
  APPLY_PLACE_RATING_UPDATED_JOB,
  PLACE_RATING_SNAPSHOT_QUEUE,
  PlaceRatingUpdatedDomainEvent,
} from '../../../shared/events/place-review.events.js';

@Injectable()
export class BullPlaceRatingUpdatedPublisher {
  constructor(
    @InjectQueue(PLACE_RATING_SNAPSHOT_QUEUE)
    private readonly queue: any,
  ) {}

  async publish(event: PlaceRatingUpdatedDomainEvent): Promise<void> {
    await this.queue.add(APPLY_PLACE_RATING_UPDATED_JOB, event, {
      jobId: event.metadata.eventId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    });
  }
}
