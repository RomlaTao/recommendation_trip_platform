import type { PlaceCatalogListItemReadModel } from '../models/place-catalog-list-item.model.js';

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

export interface SearchPlacesResult {
  items: PlaceCatalogListItemReadModel[];
  total: number;
  page: number;
  limit: number;
}
