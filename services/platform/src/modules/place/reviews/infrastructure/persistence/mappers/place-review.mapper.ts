import type { AdminReviewListItemModel } from '../../../application/models/admin-review-list-item.model.js';
import type { PlaceReviewModel } from '../../../application/models/place-review.model.js';
import { PlaceReviewOrmEntity } from '../typeorm/place-review.orm-entity.js';

export class PlaceReviewMapper {
  static toModel(orm: PlaceReviewOrmEntity): PlaceReviewModel {
    return {
      id: orm.id,
      placeId: orm.placeId,
      userId: orm.userId,
      rating: orm.rating,
      comment: orm.comment ?? null,
      imageUrls: orm.imageUrls ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    };
  }

  static toAdminListItem(row: AdminReviewListRowRaw): AdminReviewListItemModel {
    return {
      id: row.id,
      placeId: row.placeId,
      placeName: row.placeName ?? '-',
      userId: row.userId,
      authorName: row.authorName ?? 'unknown',
      rating: Number(row.rating),
      comment: row.comment ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  static applyModelToOrm(
    orm: PlaceReviewOrmEntity,
    model: PlaceReviewModel,
  ): PlaceReviewOrmEntity {
    orm.placeId = model.placeId;
    orm.userId = model.userId;
    orm.rating = model.rating;
    orm.comment = model.comment;
    orm.imageUrls = model.imageUrls;
    return orm;
  }
}

export interface AdminReviewListRowRaw {
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
