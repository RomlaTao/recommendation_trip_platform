import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import {
  APPLY_PLACE_RATING_UPDATED_JOB,
  PLACE_RATING_SNAPSHOT_QUEUE,
  PlaceRatingUpdatedDomainEvent,
} from '../../../shared/events/place-review.events.js';
import { PlaceRatingSnapshotService } from '../../application/services/place-rating-snapshot.service.js';

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceRatingSnapshotConsumer {
  private readonly logger = new Logger(PlaceRatingSnapshotConsumer.name);

  constructor(private readonly snapshotService: PlaceRatingSnapshotService) {}

  @Process(APPLY_PLACE_RATING_UPDATED_JOB)
  async handleApplyPlaceRatingUpdated(job: any): Promise<void> {
    const typedJob = job as { data: PlaceRatingUpdatedDomainEvent };
    await this.snapshotService.applyPlaceRatingUpdatedEvent(typedJob.data);
  }

  @OnQueueFailed()
  async handleFailed(job: any, error: Error): Promise<void> {
    const typedJob = job as {
      data: PlaceRatingUpdatedDomainEvent;
      opts: { attempts?: number };
      attemptsMade: number;
    };
    const maxAttempts = typedJob.opts.attempts ?? 1;
    if (typedJob.attemptsMade >= maxAttempts) {
      await this.snapshotService.markEventDeadLetter(typedJob.data, error);
      this.logger.error(
        `Place rating updated event moved to dead-letter: eventId=${typedJob.data.metadata.eventId} error=${error.message}`,
      );
    }
  }
}
