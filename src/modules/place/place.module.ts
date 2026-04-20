import { Module } from '@nestjs/common';
import { PlaceManagementModule } from './management/management.module.js';

/**
 * Umbrella module for Place domain (Management, Catalog, Reviews BCs).
 * Currently registers Management entities; extend imports when Catalog/Reviews are added.
 */
@Module({
  imports: [PlaceManagementModule],
  exports: [PlaceManagementModule],
})
export class PlaceModule {}
