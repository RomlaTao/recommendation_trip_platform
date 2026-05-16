import type { TripAggregateSnapshot } from '../aggregates/trip.aggregate.js';
import type {
  TripRouteOverviewSnapshot,
  TripRouteWaypointSnapshot,
} from '../read-models/trip-route-overview.snapshot.js';

export interface RoutePlaceCoord {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export class TripRouteOverviewBuilder {
  static build(
    snapshot: TripAggregateSnapshot,
    places: RoutePlaceCoord[],
  ): TripRouteOverviewSnapshot {
    const placeById = new Map(places.map((p) => [p.id, p]));
    const waypoints: TripRouteWaypointSnapshot[] = [];

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

    return {
      generatedAt: new Date().toISOString(),
      tripVersion: snapshot.version,
      waypoints,
    };
  }

  static parseStored(raw: unknown): TripRouteOverviewSnapshot | null {
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

    const waypoints: TripRouteWaypointSnapshot[] = [];
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
