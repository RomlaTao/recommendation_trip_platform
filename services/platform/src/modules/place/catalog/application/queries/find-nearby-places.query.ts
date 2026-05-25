export interface FindNearbyPlacesQuery {
  lat: number;
  lng: number;
  radiusInMeters: number;
  limit: number;
  destinationId?: string;
}
