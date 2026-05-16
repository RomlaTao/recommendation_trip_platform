/**
 * Persistence for denormalized place rating fields (no aggregate root).
 * Used when Reviews BC events trigger AVG/COUNT sync on `places` + ML outbox.
 */
export interface PlaceRatingSnapshot {
  placeId: string;
  averageRating: string | null;
  reviewCount: number;
  ratingLastUpdatedAt: Date;
}

export interface PlaceRatingPersistencePort {
  /** Place ids whose stored rating may be stale vs `place_reviews`. */
  findPlaceIdsNeedingReconcile(limit: number): Promise<string[]>;

  /** Recompute from reviews, update `places`, enqueue ML projection in one transaction. */
  recalculateAndPersist(placeId: string): Promise<PlaceRatingSnapshot>;
}
