import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import type { Queue } from 'bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  PLACE_RATING_SNAPSHOT_QUEUE,
  RECONCILE_RATING_SNAPSHOT_JOB,
} from '../../../shared/events/place-review.events.js';
import { ReconcilePlaceRatingsUseCase } from '../../application/use-cases/reconcile-place-ratings.use-case.js';
import { BullPlaceRatingUpdatedPublisher } from './bull-place-rating-updated.publisher.js';
import { createPlaceRatingUpdatedEvent } from '../../../shared/events/place-review.events.js';

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceRatingReconciliationScheduler implements OnModuleInit {
  private readonly logger = new Logger(PlaceRatingReconciliationScheduler.name);

  constructor(
    @InjectQueue(PLACE_RATING_SNAPSHOT_QUEUE)
    private readonly queue: Queue,
    private readonly reconcilePlaceRatings: ReconcilePlaceRatingsUseCase,
    private readonly placeRatingUpdatedPublisher: BullPlaceRatingUpdatedPublisher,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      RECONCILE_RATING_SNAPSHOT_JOB,
      {},
      {
        jobId: RECONCILE_RATING_SNAPSHOT_JOB,
        repeat: { every: 10 * 60 * 1000 },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );
  }

  @Process(RECONCILE_RATING_SNAPSHOT_JOB)
  async handleReconcile(_job: Job): Promise<void> {
    void _job;
    const snapshots = await this.reconcilePlaceRatings.execute(100);
    for (const snapshot of snapshots) {
      await this.placeRatingUpdatedPublisher.publish(
        createPlaceRatingUpdatedEvent(snapshot),
      );
    }
    if (snapshots.length > 0) {
      this.logger.log(
        `Reconciled place ratings for ${snapshots.length} places`,
      );
    }
  }
}
