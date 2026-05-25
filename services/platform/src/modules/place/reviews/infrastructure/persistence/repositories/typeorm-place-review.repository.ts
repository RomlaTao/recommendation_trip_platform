import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { AdminReviewListItemModel } from '../../../application/models/admin-review-list-item.model.js';
import type { PlaceReviewModel } from '../../../application/models/place-review.model.js';
import type {
  AdminListReviewsInput,
  CreatePlaceReviewInput,
  PlaceReviewRepositoryPort,
} from '../../../application/ports/place-review.repository.port.js';
import { PlaceStatus } from '../../../../management/enums/place-status.enum.js';
import { PlaceOrmEntity } from '../../../../management/infrastructure/persistence/typeorm/place.orm-entity.js';
import {
  AdminReviewListRowRaw,
  PlaceReviewMapper,
} from '../mappers/place-review.mapper.js';
import { PlaceReviewOrmEntity } from '../typeorm/place-review.orm-entity.js';

@Injectable()
export class TypeormPlaceReviewRepository implements PlaceReviewRepositoryPort {
  constructor(
    @InjectRepository(PlaceReviewOrmEntity)
    private readonly reviewRepository: Repository<PlaceReviewOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async existsVisiblePlace(placeId: string): Promise<boolean> {
    const place = await this.placeRepository.findOne({
      where: {
        id: placeId,
        status: PlaceStatus.APPROVED,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
    return place !== null;
  }

  async findById(
    reviewId: string,
    withDeleted = false,
  ): Promise<PlaceReviewModel | null> {
    const orm = await this.reviewRepository.findOne({
      where: { id: reviewId },
      withDeleted,
    });
    return orm ? PlaceReviewMapper.toModel(orm) : null;
  }

  async findByUserAndPlaceWithDeleted(
    userId: string,
    placeId: string,
  ): Promise<PlaceReviewModel | null> {
    const orm = await this.reviewRepository.findOne({
      where: { userId, placeId },
      withDeleted: true,
    });
    return orm ? PlaceReviewMapper.toModel(orm) : null;
  }

  async findByPlaceId(placeId: string, page: number, limit: number) {
    const [items, total] = await this.reviewRepository.findAndCount({
      where: { placeId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => PlaceReviewMapper.toModel(item)),
      total,
    };
  }

  async createReview(input: CreatePlaceReviewInput) {
    const created = this.reviewRepository.create({
      placeId: input.placeId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
      imageUrls: input.imageUrls,
    });
    const saved = await this.reviewRepository.save(created);
    return PlaceReviewMapper.toModel(saved);
  }

  async saveReview(review: Parameters<PlaceReviewRepositoryPort['saveReview']>[0]) {
    const orm = await this.reviewRepository.findOne({
      where: { id: review.id },
      withDeleted: true,
    });
    if (!orm) {
      throw new Error(`place_review_not_found:${review.id}`);
    }

    PlaceReviewMapper.applyModelToOrm(orm, review);
    const saved = await this.reviewRepository.save(orm);
    return PlaceReviewMapper.toModel(saved);
  }

  async restore(reviewId: string): Promise<void> {
    await this.reviewRepository.restore(reviewId);
  }

  async softDelete(reviewId: string): Promise<void> {
    await this.reviewRepository.softDelete(reviewId);
  }

  async findAllForAdmin(input: AdminListReviewsInput) {
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
      .getRawMany<AdminReviewListRowRaw>();

    return {
      items: rows.map((row) => PlaceReviewMapper.toAdminListItem(row)),
      total,
    };
  }
}
