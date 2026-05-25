import type { PlaceCatalogListItemReadModel } from './place-catalog-list-item.model.js';

export interface PlaceCatalogDetailReadModel
  extends PlaceCatalogListItemReadModel {
  description: string | null;
  imageUrls: string[] | null;
}
