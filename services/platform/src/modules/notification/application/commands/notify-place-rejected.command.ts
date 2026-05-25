export interface NotifyPlaceRejectedCommand {
  actorUserId: string;
  placeId: string;
  reason: string;
}
