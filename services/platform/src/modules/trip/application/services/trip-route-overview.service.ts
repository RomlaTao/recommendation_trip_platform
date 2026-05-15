import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { ResourceNotFoundError } from '../../../../common/errors/app.error.js';
import { PlaceStatus } from '../../../place/management/enums/place-status.enum.js';
import { PlaceOrmEntity } from '../../../place/management/infrastructure/persistence/typeorm/place.orm-entity.js';
import { TripAggregateSnapshot } from '../../domain/aggregates/trip.aggregate.js';
import {
  TripRouteOverviewModel,
  TripRouteWaypointModel,
} from '../models/trip-route-overview.model.js';
import { TripOrmEntity } from '../../infrastructure/persistence/typeorm/trip.orm-entity.js';

@Injectable()
export class TripRouteOverviewService {
  constructor(
    @InjectRepository(TripOrmEntity)
    private readonly tripOrmRepository: Repository<TripOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
  ) {}

  async getStoredOverview(tripId: string): Promise<TripRouteOverviewModel | null> {
    const row = await this.tripOrmRepository.findOne({
      where: { id: tripId },
      select: ['id', 'routeOverview'],
    });
    if (!row?.routeOverview) {
      return null;
    }
    return this.parseStored(row.routeOverview);
  }

  async rebuild(
    snapshot: TripAggregateSnapshot,
  ): Promise<TripRouteOverviewModel> {
    const placeIds = new Set<string>();
    for (const day of snapshot.days) {
      for (const item of day.toSnapshot().items) {
        placeIds.add(item.placeId);
      }
    }

    const places =
      placeIds.size === 0
        ? []
        : await this.placeRepository.find({
            where: {
              id: In([...placeIds]),
              deletedAt: IsNull(),
              status: PlaceStatus.APPROVED,
            },
            select: ['id', 'name', 'lat', 'lng'],
          });

    const placeById = new Map(places.map((p) => [p.id, p]));
    const waypoints: TripRouteWaypointModel[] = [];

    const sortedDays = [...snapshot.days].sort(
      (a, b) => a.dayIndex - b.dayIndex,
    );

    for (const day of sortedDays) {
      const daySnapshot = day.toSnapshot();
      const sortedItems = [...daySnapshot.items].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      for (const item of sortedItems) {
        const itemSnapshot = item.toSnapshot();
        const place = placeById.get(itemSnapshot.placeId);
        if (!place) {
          continue;
        }

        const lat = Number(place.lat);
        const lng = Number(place.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          continue;
        }

        waypoints.push({
          tripItemId: itemSnapshot.id,
          placeId: itemSnapshot.placeId,
          dayIndex: daySnapshot.dayIndex,
          sortOrder: itemSnapshot.sortOrder,
          name: place.name,
          lat,
          lng,
        });
      }
    }

    const overview: TripRouteOverviewModel = {
      generatedAt: new Date().toISOString(),
      tripVersion: snapshot.version,
      waypoints,
    };

    const updated = await this.tripOrmRepository.update(
      { id: snapshot.id },
      { routeOverview: overview },
    );

    if (!updated.affected) {
      throw new ResourceNotFoundError('trip_not_found');
    }

    return overview;
  }

  private parseStored(raw: unknown): TripRouteOverviewModel | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const o = raw as Record<string, unknown>;
    const generatedAt =
      typeof o.generatedAt === 'string' ? o.generatedAt : '';
    const tripVersion = Number(o.tripVersion ?? NaN);
    const wpRaw = o.waypoints;
    if (!generatedAt || !Number.isFinite(tripVersion) || !Array.isArray(wpRaw)) {
      return null;
    }

    const waypoints: TripRouteWaypointModel[] = [];
    for (const row of wpRaw) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const w = row as Record<string, unknown>;
      const lat = Number(w.lat ?? NaN);
      const lng = Number(w.lng ?? NaN);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }
      waypoints.push({
        tripItemId: String(w.tripItemId ?? ''),
        placeId: String(w.placeId ?? ''),
        dayIndex: Number(w.dayIndex ?? 0),
        sortOrder: Number(w.sortOrder ?? 0),
        name: String(w.name ?? ''),
        lat,
        lng,
      });
    }

    return { generatedAt, tripVersion, waypoints };
  }
}
