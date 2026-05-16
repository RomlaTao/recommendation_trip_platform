import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { ResourceNotFoundError } from '../../../../common/errors/app.error.js';
import { DestinationOrmEntity } from '../../../place/management/infrastructure/persistence/typeorm/destination.orm-entity.js';
import { PlaceOrmEntity } from '../../../place/management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { PlaceStatus } from '../../../place/management/enums/place-status.enum.js';
import type { TripPlaceReadPort } from '../../application/ports/trip-place-read.port.js';
import { TripPlaceDestinationMismatchError } from '../../domain/errors/trip-place-destination-mismatch.error.js';
import type { RoutePlaceCoord } from '../../domain/services/trip-route-overview.builder.js';

@Injectable()
export class TypeormTripPlaceReadAdapter implements TripPlaceReadPort {
  constructor(
    @InjectRepository(DestinationOrmEntity)
    private readonly destinationRepository: Repository<DestinationOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async assertDestinationExists(destinationId: string): Promise<void> {
    const destination = await this.destinationRepository.findOne({
      where: { id: destinationId, deletedAt: IsNull() },
    });

    if (!destination) {
      throw new ResourceNotFoundError('destination_not_found');
    }
  }

  async assertPlaceMatchesDestination(
    placeId: string,
    destinationId: string,
  ): Promise<void> {
    const place = await this.placeRepository.findOne({
      where: { id: placeId, deletedAt: IsNull() },
      select: ['id', 'destinationId'],
    });

    if (!place) {
      throw new ResourceNotFoundError('place_not_found');
    }

    if (place.destinationId !== destinationId) {
      throw new TripPlaceDestinationMismatchError();
    }
  }

  async assertPlacesMatchDestination(
    placeIds: string[],
    destinationId: string,
  ): Promise<void> {
    if (placeIds.length === 0) {
      return;
    }

    const uniquePlaceIds = [...new Set(placeIds)];
    const places = await this.placeRepository.find({
      where: { id: In(uniquePlaceIds), deletedAt: IsNull() },
      select: ['id', 'destinationId'],
    });

    if (places.length !== uniquePlaceIds.length) {
      throw new ResourceNotFoundError('place_not_found');
    }

    const hasMismatch = places.some(
      (place) => place.destinationId !== destinationId,
    );

    if (hasMismatch) {
      throw new TripPlaceDestinationMismatchError();
    }
  }

  async findApprovedRoutePlaces(placeIds: string[]): Promise<RoutePlaceCoord[]> {
    if (placeIds.length === 0) {
      return [];
    }

    const uniquePlaceIds = [...new Set(placeIds)];
    const places = await this.placeRepository.find({
      where: {
        id: In(uniquePlaceIds),
        deletedAt: IsNull(),
        status: PlaceStatus.APPROVED,
      },
      select: ['id', 'name', 'lat', 'lng'],
    });

    const coords: RoutePlaceCoord[] = [];
    for (const place of places) {
      const lat = Number(place.lat);
      const lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }
      coords.push({
        id: place.id,
        name: place.name,
        lat,
        lng,
      });
    }
    return coords;
  }
}
