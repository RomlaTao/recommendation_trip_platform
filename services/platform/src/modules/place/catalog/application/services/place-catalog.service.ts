import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../../common/errors/app.error.js';
import { PLACE_CATALOG_REPOSITORY } from '../catalog.di-tokens.js';
import {
  FindNearbyPlacesQuery,
  PaginatedPlaceCatalogItems,
  PlaceCatalogSort,
  NearbyPlaceReadModel,
  SearchPlacesQuery,
} from '../ports/place-catalog-repository.port.js';
import type {
  PlaceCatalogDetailReadModel,
  PlaceCatalogRepositoryPort,
  DestinationReadModel,
  PlaceCategoryReadModel,
} from '../ports/place-catalog-repository.port.js';

export interface GetPlacesInput {
  q?: string;
  categoryId?: string;
  destinationId?: string;
  minRating?: number;
  sort: PlaceCatalogSort;
  page: number;
  limit: number;
}

export interface GetNearbyPlacesInput {
  lat: number;
  lng: number;
  radiusInMeters: number;
  limit: number;
  destinationId?: string;
}

@Injectable()
export class PlaceCatalogService {
  private readonly logger = new Logger(PlaceCatalogService.name);

  constructor(
    @Inject(PLACE_CATALOG_REPOSITORY)
    private readonly repository: PlaceCatalogRepositoryPort,
  ) {}

  getPlaces(input: GetPlacesInput): Promise<PaginatedPlaceCatalogItems> {
    const query: SearchPlacesQuery = {
      q: input.q?.trim() || undefined,
      categoryId: input.categoryId,
      destinationId: input.destinationId,
      minRating: input.minRating,
      sort: input.sort,
      page: input.page,
      limit: input.limit,
    };

    return this.repository.search(query);
  }

  async getPlaceById(placeId: string): Promise<PlaceCatalogDetailReadModel> {
    const place = await this.repository.findById(placeId);
    if (!place) {
      throw new ResourceNotFoundError('place_not_found');
    }

    return place;
  }

  getCategories(): Promise<PlaceCategoryReadModel[]> {
    return this.repository.listCategories();
  }

  getDestinations(): Promise<DestinationReadModel[]> {
    return this.repository.listDestinations();
  }

  getNearbyPlaces(
    input: GetNearbyPlacesInput,
  ): Promise<NearbyPlaceReadModel[]> {
    const query: FindNearbyPlacesQuery = {
      lat: input.lat,
      lng: input.lng,
      radiusInMeters: input.radiusInMeters,
      limit: input.limit,
      destinationId: input.destinationId,
    };
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
