export type PlaceCatalogSort = 'newest' | 'rating_desc' | 'name_asc';

export interface SearchPlacesQuery {
  q?: string;
  categoryId?: string;
  destinationId?: string;
  minRating?: number;
  sort: PlaceCatalogSort;
  page: number;
  limit: number;
}

export interface FindNearbyPlacesQuery {
  lat: number;
  lng: number;
  radiusInMeters: number;
  limit: number;
  destinationId?: string;
}

export interface PlaceRatingReadModel {
  averageRating: number | null;
  reviewCount: number;
}

export interface PlaceCatalogListItemReadModel {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  thumbnailUrl: string | null;
  categoryId: string;
  categoryName: string;
  destinationId: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  seedRating: PlaceRatingReadModel;
  communityRating: PlaceRatingReadModel;
}

export interface PlaceCatalogDetailReadModel extends PlaceCatalogListItemReadModel {
  description: string | null;
  imageUrls: string[] | null;
}

export interface PlaceCategoryReadModel {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface DestinationReadModel {
  id: string;
  name: string;
  slug: string;
}

export interface NearbyPlaceReadModel extends PlaceCatalogListItemReadModel {
  distanceInMeters: number;
}

export interface PaginatedPlaceCatalogItems {
  items: PlaceCatalogListItemReadModel[];
  total: number;
  page: number;
  limit: number;
}

export interface PlaceCatalogRepositoryPort {
  search(query: SearchPlacesQuery): Promise<PaginatedPlaceCatalogItems>;
  findById(placeId: string): Promise<PlaceCatalogDetailReadModel | null>;
  listCategories(): Promise<PlaceCategoryReadModel[]>;
  listDestinations(): Promise<DestinationReadModel[]>;
  findNearby(query: FindNearbyPlacesQuery): Promise<NearbyPlaceReadModel[]>;
}
