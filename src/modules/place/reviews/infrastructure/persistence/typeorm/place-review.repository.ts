import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PlaceStatus } from '../../../../management/enums/place-status.enum.js';
import { PlaceOrmEntity } from '../../../../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PlaceReviewOrmEntity } from './place-review.orm-entity.js';

@Injectable()
export class PlaceReviewRepository {
  constructor(
    @InjectRepository(PlaceReviewOrmEntity)
    private readonly reviewRepository: Repository<PlaceReviewOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async findVisiblePlaceById(placeId: string): Promise<Pick<PlaceOrmEntity, 'id'> | null> {
    return this.placeRepository.findOne({
      where: {
        id: placeId,
        status: PlaceStatus.APPROVED,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
  }

  async findById(reviewId: string, withDeleted = false): Promise<PlaceReviewOrmEntity | null> {
    return this.reviewRepository.findOne({
      where: { id: reviewId },
      withDeleted,
    });
  }

  async findByUserAndPlace(userId: string, placeId: string): Promise<PlaceReviewOrmEntity | null> {
    return this.reviewRepository.findOne({
      where: { userId, placeId },
    });
  }

  async findByUserAndPlaceWithDeleted(
    userId: string,
    placeId: string,
  ): Promise<PlaceReviewOrmEntity | null> {
    return this.reviewRepository.findOne({
      where: { userId, placeId },
      withDeleted: true,
    });
  }

  async findByPlaceId(placeId: string, page: number, limit: number) {
    const [items, total] = await this.reviewRepository.findAndCount({
      where: { placeId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  create(data: Pick<PlaceReviewOrmEntity, 'placeId' | 'userId' | 'rating' | 'comment' | 'imageUrls'>) {
    return this.reviewRepository.create(data);
  }

  async save(review: PlaceReviewOrmEntity): Promise<PlaceReviewOrmEntity> {
    return this.reviewRepository.save(review);
  }

  async restore(reviewId: string): Promise<void> {
    await this.reviewRepository.restore(reviewId);
  }

  async softDelete(reviewId: string): Promise<void> {
    await this.reviewRepository.softDelete(reviewId);
  }
}
