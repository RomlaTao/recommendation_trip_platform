import type { AdminReviewListItemModel } from '../../application/models/admin-review-list-item.model.js';
import type { PlaceReviewModel } from '../../application/models/place-review.model.js';
import type { AdminReviewListItemDto } from '../dtos/admin-review-response.dto.js';
import type { PlaceReviewDto } from '../dtos/review-response.dto.js';

export class PlaceReviewPresentationMapper {
  static toPlaceReviewResponse(model: PlaceReviewModel): PlaceReviewDto {
    return {
      id: model.id,
      placeId: model.placeId,
      userId: model.userId,
      rating: model.rating,
      comment: model.comment,
      imageUrls: model.imageUrls,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toAdminReviewListItemResponse(
    model: AdminReviewListItemModel,
  ): AdminReviewListItemDto {
    return {
      id: model.id,
      placeId: model.placeId,
      placeName: model.placeName,
      userId: model.userId,
      authorName: model.authorName,
      rating: model.rating,
      comment: model.comment,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
