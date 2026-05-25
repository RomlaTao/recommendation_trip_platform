import type { DestinationReadModel } from '../models/destination.model.js';
import type { NearbyPlaceReadModel } from '../models/nearby-place.model.js';
import type { PlaceCatalogDetailReadModel } from '../models/place-catalog-detail.model.js';
import type { PlaceCategoryReadModel } from '../models/place-category.model.js';
import type { FindNearbyPlacesQuery } from '../queries/find-nearby-places.query.js';
import type {
  SearchPlacesQuery,
  SearchPlacesResult,
} from '../queries/search-places.query.js';

export interface PlaceCatalogRepositoryPort {
  search(query: SearchPlacesQuery): Promise<SearchPlacesResult>;
  findById(placeId: string): Promise<PlaceCatalogDetailReadModel | null>;
  listCategories(): Promise<PlaceCategoryReadModel[]>;
  listDestinations(): Promise<DestinationReadModel[]>;
  findNearby(query: FindNearbyPlacesQuery): Promise<NearbyPlaceReadModel[]>;
}
