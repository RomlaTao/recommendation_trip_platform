import type { DestinationReadModel } from '../../application/models/destination.model.js';
import type { NearbyPlaceReadModel } from '../../application/models/nearby-place.model.js';
import type { PlaceCatalogDetailReadModel } from '../../application/models/place-catalog-detail.model.js';
import type { PlaceCatalogListItemReadModel } from '../../application/models/place-catalog-list-item.model.js';
import type { PlaceCategoryReadModel } from '../../application/models/place-category.model.js';
import type { PlaceRatingReadModel } from '../../application/models/place-rating.model.js';
import type {
  DestinationDto,
  NearbyPlaceDto,
  PlaceCategoryDto,
  PlaceDetailDto,
  PlaceListItemDto,
  PlaceRatingBlockDto,
} from '../dtos/place-catalog.response.dto.js';

export class PlaceCatalogPresentationMapper {
  static toPlaceListItemResponse(
    model: PlaceCatalogListItemReadModel,
  ): PlaceListItemDto {
    return {
      id: model.id,
      name: model.name,
      address: model.address,
      lat: model.lat,
      lng: model.lng,
      thumbnailUrl: model.thumbnailUrl,
      categoryId: model.categoryId,
      categoryName: model.categoryName,
      destinationId: model.destinationId,
      destinationName: model.destinationName,
      destinationSlug: model.destinationSlug,
      seedRating: PlaceCatalogPresentationMapper.toRatingBlockResponse(
        model.seedRating,
      ),
      communityRating: PlaceCatalogPresentationMapper.toRatingBlockResponse(
        model.communityRating,
      ),
    };
  }

  static toPlaceDetailResponse(model: PlaceCatalogDetailReadModel): PlaceDetailDto {
    return {
      ...PlaceCatalogPresentationMapper.toPlaceListItemResponse(model),
      description: model.description,
      imageUrls: model.imageUrls,
    };
  }

  static toNearbyPlaceResponse(model: NearbyPlaceReadModel): NearbyPlaceDto {
    return {
      ...PlaceCatalogPresentationMapper.toPlaceListItemResponse(model),
      distanceInMeters: model.distanceInMeters,
    };
  }

  static toCategoryResponse(model: PlaceCategoryReadModel): PlaceCategoryDto {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      parentId: model.parentId,
    };
  }

  static toDestinationResponse(model: DestinationReadModel): DestinationDto {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
    };
  }

  private static toRatingBlockResponse(
    model: PlaceRatingReadModel,
  ): PlaceRatingBlockDto {
    return {
      averageRating: model.averageRating,
      reviewCount: model.reviewCount,
    };
  }
}
