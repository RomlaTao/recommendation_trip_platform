import type { PlaceRatingReadModel } from './place-rating.model.js';

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
