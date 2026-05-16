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

  async findVisiblePlaceById(
    placeId: string,
  ): Promise<Pick<PlaceOrmEntity, 'id'> | null> {
    return this.placeRepository.findOne({
      where: {
        id: placeId,
        status: PlaceStatus.APPROVED,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
  }

  async findById(
    reviewId: string,
    withDeleted = false,
  ): Promise<PlaceReviewOrmEntity | null> {
    return this.reviewRepository.findOne({
      where: { id: reviewId },
      withDeleted,
    });
  }

  async findByUserAndPlace(
    userId: string,
    placeId: string,
  ): Promise<PlaceReviewOrmEntity | null> {
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

  create(
    data: Pick<
      PlaceReviewOrmEntity,
      'placeId' | 'userId' | 'rating' | 'comment' | 'imageUrls'
    >,
  ) {
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

  async findAllForAdmin(input: {
    page: number;
    limit: number;
    q?: string;
    rating?: number;
    status?: 'all' | 'active' | 'deleted';
  }): Promise<{ items: AdminReviewListRow[]; total: number }> {
    const qb = this.reviewRepository
      .createQueryBuilder('r')
      .leftJoin('places', 'p', 'p.id = r.placeId')
      .leftJoin('users', 'u', 'u.id = r.userId')
      .select('r.id', 'id')
      .addSelect('r.placeId', 'placeId')
      .addSelect('r.userId', 'userId')
      .addSelect('r.rating', 'rating')
      .addSelect('r.comment', 'comment')
      .addSelect('r.createdAt', 'createdAt')
      .addSelect('r.updatedAt', 'updatedAt')
      .addSelect('r.deletedAt', 'deletedAt')
      .addSelect('p.name', 'placeName')
      .addSelect('COALESCE(u.username, u.email)', 'authorName');

    if (input.status === 'deleted') {
      qb.withDeleted().andWhere('r.deletedAt IS NOT NULL');
    } else if (input.status === 'active') {
      qb.andWhere('r.deletedAt IS NULL');
    } else {
      qb.withDeleted();
    }

    if (input.rating) {
      qb.andWhere('r.rating = :rating', { rating: input.rating });
    }

    if (input.q?.trim()) {
      const term = `%${input.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(COALESCE(r.comment, '')) LIKE :term OR LOWER(COALESCE(u.username, '')) LIKE :term OR LOWER(COALESCE(u.email, '')) LIKE :term OR LOWER(COALESCE(p.name, '')) LIKE :term)`,
        { term },
      );
    }

    const total = await qb.getCount();

    const rows = await qb
      .orderBy('r.createdAt', 'DESC')
      .offset((input.page - 1) * input.limit)
      .limit(input.limit)
      .getRawMany<AdminReviewListRow>();

    return { items: rows, total };
  }
}

export interface AdminReviewListRow {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  placeName: string | null;
  authorName: string | null;
}
