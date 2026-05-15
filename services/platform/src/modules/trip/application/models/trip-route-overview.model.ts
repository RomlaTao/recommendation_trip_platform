export interface TripRouteWaypointModel {
  tripItemId: string;
  placeId: string;
  dayIndex: number;
  sortOrder: number;
  name: string;
  lat: number;
  lng: number;
}

export interface TripRouteOverviewModel {
  generatedAt: string;
  tripVersion: number;
  waypoints: TripRouteWaypointModel[];
}
