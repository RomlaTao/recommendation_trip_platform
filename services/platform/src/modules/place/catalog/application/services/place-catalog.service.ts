import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import type { DestinationReadModel } from '../models/destination.model.js';
import type { PlaceCatalogDetailReadModel } from '../models/place-catalog-detail.model.js';
import type { PlaceCategoryReadModel } from '../models/place-category.model.js';
import type { PlaceCatalogRepositoryPort } from '../ports/place-catalog-repository.port.js';
import type { FindNearbyPlacesQuery } from '../queries/find-nearby-places.query.js';
import type {
  SearchPlacesQuery,
  SearchPlacesResult,
} from '../queries/search-places.query.js';
import { PLACE_CATALOG_REPOSITORY } from '../catalog.di-tokens.js';

@Injectable()
export class PlaceCatalogService {
  private readonly logger = new Logger(PlaceCatalogService.name);

  constructor(
    @Inject(PLACE_CATALOG_REPOSITORY)
    private readonly repository: PlaceCatalogRepositoryPort,
  ) {}

  search(query: SearchPlacesQuery): Promise<SearchPlacesResult> {
    return this.repository.search({
      ...query,
      q: query.q?.trim() || undefined,
    });
  }

  async getPlaceById(placeId: string): Promise<PlaceCatalogDetailReadModel> {
    const place = await this.repository.findById(placeId);
    if (!place) {
      throw new ResourceNotFoundError('place_not_found');
    }

    return place;
  }

  listCategories(): Promise<PlaceCategoryReadModel[]> {
    return this.repository.listCategories();
  }

  listDestinations(): Promise<DestinationReadModel[]> {
    return this.repository.listDestinations();
  }

  findNearby(query: FindNearbyPlacesQuery) {
    const startedAt = Date.now();

    return this.repository.findNearby(query).then((items) => {
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= 300) {
        this.logger.warn(
          `Nearby query is slow (${elapsedMs}ms) lat=${query.lat}, lng=${query.lng}, radius=${query.radiusInMeters}, limit=${query.limit}`,
        );
      }
      return items;
    });
  }
}
