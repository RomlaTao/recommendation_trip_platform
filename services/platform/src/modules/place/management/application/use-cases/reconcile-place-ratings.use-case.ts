import { Inject, Injectable } from '@nestjs/common';
import { PLACE_RATING_PERSISTENCE } from '../management.di-tokens.js';
import type {
  PlaceRatingPersistencePort,
  PlaceRatingSnapshot,
} from '../ports/place-rating-persistence.port.js';

@Injectable()
export class ReconcilePlaceRatingsUseCase {
  constructor(
    @Inject(PLACE_RATING_PERSISTENCE)
    private readonly placeRatingPersistence: PlaceRatingPersistencePort,
  ) {}

  async execute(limit = 100): Promise<PlaceRatingSnapshot[]> {
    const placeIds =
      await this.placeRatingPersistence.findPlaceIdsNeedingReconcile(limit);
    const snapshots: PlaceRatingSnapshot[] = [];
    for (const placeId of placeIds) {
      snapshots.push(
        await this.placeRatingPersistence.recalculateAndPersist(placeId),
      );
    }
    return snapshots;
  }
}
