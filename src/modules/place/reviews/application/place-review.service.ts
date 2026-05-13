import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../common/errors/app.error.js';
import {
  createReviewCreatedEvent,
  createReviewDeletedEvent,
  createReviewUpdatedEvent,
} from '../../shared/events/place-review.events.js';
import { PLACE_REVIEW_EVENT_PUBLISHER } from './reviews.di-tokens.js';
import type { PlaceReviewEventPublisherPort } from './ports/place-review-event-publisher.port.js';
import { PlaceReviewRepository } from '../infrastructure/persistence/typeorm/place-review.repository.js';
import { CreateReviewDto } from '../presentation/dtos/create-review.dto.js';
import { UpdateReviewDto } from '../presentation/dtos/update-review.dto.js';

@Injectable()
export class PlaceReviewService {
  constructor(
    private readonly placeReviewRepository: PlaceReviewRepository,
    @Inject(PLACE_REVIEW_EVENT_PUBLISHER)
    private readonly reviewEventPublisher: PlaceReviewEventPublisherPort,
  ) {}

  async getPlaceReviews(placeId: string, page: number, limit: number) {
    const place =
      await this.placeReviewRepository.findVisiblePlaceById(placeId);
    if (!place) {
      throw new ResourceNotFoundError('place_not_found');
    }

    const { items, total } = await this.placeReviewRepository.findByPlaceId(
      placeId,
      page,
      limit,
    );
    return { items, total, page, limit };
  }

  async upsertReview(placeId: string, userId: string, dto: CreateReviewDto) {
    const place =
      await this.placeReviewRepository.findVisiblePlaceById(placeId);
    if (!place) {
      throw new ResourceNotFoundError('place_not_found');
    }

    const existing =
      await this.placeReviewRepository.findByUserAndPlaceWithDeleted(
        userId,
        placeId,
      );
    const imageUrls = dto.imageUrls ?? null;
    const comment = dto.comment ?? null;

    if (!existing) {
      const created = this.placeReviewRepository.create({
        placeId,
        userId,
        rating: dto.rating,
        comment,
        imageUrls,
      });
      const saved = await this.placeReviewRepository.save(created);

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
    existing.rating = dto.rating;
    existing.comment = comment;
    existing.imageUrls = imageUrls;
    const saved = await this.placeReviewRepository.save(existing);

    if (existing.deletedAt) {
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
    dto: UpdateReviewDto,
  ) {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('review_forbidden');
    }

    const oldRating = review.rating;
    review.rating = dto.rating ?? review.rating;
    review.comment = dto.comment ?? review.comment ?? null;
    review.imageUrls = dto.imageUrls ?? review.imageUrls ?? null;
    const saved = await this.placeReviewRepository.save(review);

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

  async deleteOwnReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.placeReviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundError('review_not_found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('review_forbidden');
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
