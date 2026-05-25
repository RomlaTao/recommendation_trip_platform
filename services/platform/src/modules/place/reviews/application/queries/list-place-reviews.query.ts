import type { PlaceReviewModel } from '../models/place-review.model.js';

export interface ListPlaceReviewsQuery {
  page: number;
  limit: number;
}

export interface ListPlaceReviewsResult {
  items: PlaceReviewModel[];
  total: number;
  page: number;
  limit: number;
}
