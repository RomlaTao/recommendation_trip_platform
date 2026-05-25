import type { PlaceCatalogListItemReadModel } from './place-catalog-list-item.model.js';

export interface NearbyPlaceReadModel extends PlaceCatalogListItemReadModel {
  distanceInMeters: number;
}
