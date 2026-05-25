import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import {
  createReviewCreatedEvent,
  createReviewDeletedEvent,
  createReviewUpdatedEvent,
} from '../../../shared/events/place-review.events.js';
import type { UpsertReviewCommand } from '../commands/upsert-review.command.js';
import type { UpdateOwnReviewCommand } from '../commands/update-own-review.command.js';
import { ReviewForbiddenError } from '../errors/place-review.errors.js';
import type { PlaceReviewModel } from '../models/place-review.model.js';
import type { PlaceReviewEventPublisherPort } from '../ports/place-review-event-publisher.port.js';
import type { PlaceReviewRepositoryPort } from '../ports/place-review.repository.port.js';
import type {
  ListPlaceReviewsQuery,
  ListPlaceReviewsResult,
} from '../queries/list-place-reviews.query.js';
import type {
  ListReviewsForAdminQuery,
  ListReviewsForAdminResult,
} from '../queries/list-reviews-for-admin.query.js';
import {
  PLACE_REVIEW_EVENT_PUBLISHER,
  PLACE_REVIEW_REPOSITORY,
} from '../reviews.di-tokens.js';

@Injectable()
export class PlaceReviewService {
  constructor(
    @Inject(PLACE_REVIEW_REPOSITORY)
    private readonly placeReviewRepository: PlaceReviewRepositoryPort,
    @Inject(PLACE_REVIEW_EVENT_PUBLISHER)
    private readonly reviewEventPublisher: PlaceReviewEventPublisherPort,
  ) {}

  async getPlaceReviews(
    placeId: string,
    query: ListPlaceReviewsQuery,
  ): Promise<ListPlaceReviewsResult> {
    const placeExists =
      await this.placeReviewRepository.existsVisiblePlace(placeId);
    if (!placeExists) {
      throw new ResourceNotFoundError('place_not_found');
    }

    const { items, total } = await this.placeReviewRepository.findByPlaceId(
      placeId,
      query.page,
      query.limit,
    );

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async upsertReview(
    placeId: string,
    userId: string,
    command: UpsertReviewCommand,
  ): Promise<PlaceReviewModel> {
    const placeExists =
      await this.placeReviewRepository.existsVisiblePlace(placeId);
    if (!placeExists) {
      throw new ResourceNotFoundError('place_not_found');
    }

    const existing =
      await this.placeReviewRepository.findByUserAndPlaceWithDeleted(
        userId,
        placeId,
      );
    const imageUrls = command.imageUrls ?? null;
    const comment = command.comment ?? null;

    if (!existing) {
      const saved = await this.placeReviewRepository.createReview({
        placeId,
        userId,
        rating: command.rating,
        comment,
        imageUrls,
      });

      await this.reviewEventPublisher.publish(
        createReviewCreatedEvent({
          reviewId: saved.id,
          placeId: saved.placeId,
          userId: saved.userId,
          rating: saved.rating,
        }),
      );

      return saved;
    }

    const oldRating = existing.rating;
    const wasDeleted = existing.deletedAt != null;
    const saved = await this.placeReviewRepository.saveReview({
      ...existing,
      rating: command.rating,
      comment,
      imageUrls,
    });

    if (wasDeleted) {
      await this.placeReviewRepository.restore(existing.id);
      await this.reviewEventPublisher.publish(
        createReviewCreatedEvent({
          reviewId: saved.id,
          placeId: saved.placeId,
          userId: saved.userId,
          rating: saved.rating,
        }),
      );
      const restored = await this.placeReviewRepository.findById(saved.id);
      if (!restored) {
        throw new ResourceNotFoundError('review_not_found');
      }
      return restored;
    }

    await this.reviewEventPublisher.publish(
      createReviewUpdatedEvent({
        reviewId: saved.id,
        placeId: saved.placeId,
        userId: saved.userId,
        oldRating,
        newRating: saved.rating,
      }),
    );

    return saved;
  }

  async updateOwnReview(
    reviewId: string,
    userId: string,
    command: UpdateOwnReviewCommand,
  ): Promise<PlaceReviewModel> {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ReviewForbiddenError();
    }

    const oldRating = review.rating;
    const saved = await this.placeReviewRepository.saveReview({
      ...review,
      rating: command.rating ?? review.rating,
      comment: command.comment ?? review.comment ?? null,
      imageUrls: command.imageUrls ?? review.imageUrls ?? null,
    });

    await this.reviewEventPublisher.publish(
      createReviewUpdatedEvent({
        reviewId: saved.id,
        placeId: saved.placeId,
        userId: saved.userId,
        oldRating,
        newRating: saved.rating,
      }),
    );

    return saved;
  }

  async listReviewsForAdmin(
    query: ListReviewsForAdminQuery,
  ): Promise<ListReviewsForAdminResult> {
    const { items, total } = await this.placeReviewRepository.findAllForAdmin({
      page: query.page,
      limit: query.limit,
      q: query.q,
      rating: query.rating,
      status: query.status ?? 'all',
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async deleteReviewByAdmin(reviewId: string): Promise<void> {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    await this.placeReviewRepository.softDelete(reviewId);

    await this.reviewEventPublisher.publish(
      createReviewDeletedEvent({
        reviewId: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
      }),
    );
  }

  async restoreReviewByAdmin(reviewId: string): Promise<void> {
    const review = await this.placeReviewRepository.findById(reviewId, true);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    await this.placeReviewRepository.restore(reviewId);
  }

  async deleteOwnReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ReviewForbiddenError();
    }

    await this.placeReviewRepository.softDelete(reviewId);

    await this.reviewEventPublisher.publish(
      createReviewDeletedEvent({
        reviewId: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
      }),
    );
  }
}
