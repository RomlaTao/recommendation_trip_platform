import type { PlaceCatalogDetailReadModel } from '../../../application/models/place-catalog-detail.model.js';
import type { PlaceCatalogListItemReadModel } from '../../../application/models/place-catalog-list-item.model.js';

export class PlaceCatalogMapper {
  static toListItem(row: PlaceSearchRow): PlaceCatalogListItemReadModel {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      lat: Number(row.lat),
      lng: Number(row.lng),
      thumbnailUrl: row.thumbnailUrl ?? null,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      destinationId: row.destinationId ?? null,
      destinationName: row.destinationName ?? null,
      destinationSlug: row.destinationSlug ?? null,
      seedRating: {
        averageRating:
          row.seedAverageRating === null ? null : Number(row.seedAverageRating),
        reviewCount: row.seedReviewCount ?? 0,
      },
      communityRating: {
        averageRating:
          row.averageRating === null ? null : Number(row.averageRating),
        reviewCount: row.reviewCount ?? 0,
      },
    };
  }

  static toDetailItem(row: PlaceDetailRow): PlaceCatalogDetailReadModel {
    return {
      ...PlaceCatalogMapper.toListItem(row),
      description: row.description ?? null,
      imageUrls: row.imageUrls ?? null,
    };
  }
}

export interface PlaceSearchRow {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  thumbnailUrl: string | null;
  categoryId: string;
  categoryName: string;
  destinationId: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  seedAverageRating: string | null;
  seedReviewCount: number | null;
  averageRating: string | null;
  reviewCount: number | null;
}

export interface PlaceDetailRow extends PlaceSearchRow {
  description: string | null;
  imageUrls: string[] | null;
}

export interface NearbySearchRow extends PlaceSearchRow {
  distanceInMeters: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}
