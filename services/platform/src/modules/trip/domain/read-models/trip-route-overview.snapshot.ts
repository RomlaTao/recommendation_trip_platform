export interface TripRouteWaypointSnapshot {
  tripItemId: string;
  placeId: string;
  dayIndex: number;
  sortOrder: number;
  name: string;
  lat: number;
  lng: number;
}

export interface TripRouteOverviewSnapshot {
  generatedAt: string;
  tripVersion: number;
  waypoints: TripRouteWaypointSnapshot[];
}
