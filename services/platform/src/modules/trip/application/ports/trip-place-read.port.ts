import type { RoutePlaceCoord } from '../../domain/services/trip-route-overview.builder.js';

export interface TripPlaceReadPort {
  assertDestinationExists(destinationId: string): Promise<void>;
  assertPlaceMatchesDestination(
    placeId: string,
    destinationId: string,
  ): Promise<void>;
  assertPlacesMatchDestination(
    placeIds: string[],
    destinationId: string,
  ): Promise<void>;
  findApprovedRoutePlaces(placeIds: string[]): Promise<RoutePlaceCoord[]>;
}
