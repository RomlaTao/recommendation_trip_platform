import type { AdminReviewListItemModel } from '../models/admin-review-list-item.model.js';
import type { PlaceReviewModel } from '../models/place-review.model.js';

export interface CreatePlaceReviewInput {
  placeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  imageUrls: string[] | null;
}

export interface AdminListReviewsInput {
  page: number;
  limit: number;
  q?: string;
  rating?: number;
  status?: 'all' | 'active' | 'deleted';
}

export interface PlaceReviewRepositoryPort {
  existsVisiblePlace(placeId: string): Promise<boolean>;
  findById(
    reviewId: string,
    withDeleted?: boolean,
  ): Promise<PlaceReviewModel | null>;
  findByUserAndPlaceWithDeleted(
    userId: string,
    placeId: string,
  ): Promise<PlaceReviewModel | null>;
  findByPlaceId(
    placeId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PlaceReviewModel[]; total: number }>;
  createReview(input: CreatePlaceReviewInput): Promise<PlaceReviewModel>;
  saveReview(review: PlaceReviewModel): Promise<PlaceReviewModel>;
  restore(reviewId: string): Promise<void>;
  softDelete(reviewId: string): Promise<void>;
  findAllForAdmin(
    input: AdminListReviewsInput,
  ): Promise<{ items: AdminReviewListItemModel[]; total: number }>;
}
