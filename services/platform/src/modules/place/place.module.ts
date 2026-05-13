import { Module } from '@nestjs/common';
import { PlaceManagementModule } from './management/management.module.js';
import { PlaceCatalogModule } from './catalog/catalog.module.js';
import { PlaceReviewsModule } from './reviews/reviews.module.js';

/**
 * Umbrella module for Place domain (Management, Catalog, Reviews BCs).
 * Currently registers Management entities; extend imports when Catalog/Reviews are added.
 */
@Module({
  imports: [PlaceManagementModule, PlaceCatalogModule, PlaceReviewsModule],
  exports: [PlaceManagementModule, PlaceCatalogModule, PlaceReviewsModule],
})
export class PlaceModule {}
