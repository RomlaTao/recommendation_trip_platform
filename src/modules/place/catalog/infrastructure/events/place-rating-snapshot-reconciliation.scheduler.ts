import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import {
  PLACE_RATING_SNAPSHOT_QUEUE,
  RECONCILE_RATING_SNAPSHOT_JOB,
} from '../../../shared/events/place-review.events.js';
import { PlaceRatingSnapshotService } from '../../application/services/place-rating-snapshot.service.js';

@Injectable()
@Processor(PLACE_RATING_SNAPSHOT_QUEUE)
export class PlaceRatingSnapshotReconciliationScheduler implements OnModuleInit {
  private readonly logger = new Logger(PlaceRatingSnapshotReconciliationScheduler.name);

  constructor(
    @InjectQueue(PLACE_RATING_SNAPSHOT_QUEUE)
    private readonly queue: any,
    private readonly snapshotService: PlaceRatingSnapshotService,
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
  async handleReconcile(_job: any): Promise<void> {
    const affected = await this.snapshotService.reconcile(100);
    if (affected > 0) {
      this.logger.log(`Reconciled rating snapshots for ${affected} places`);
    }
  }
}
