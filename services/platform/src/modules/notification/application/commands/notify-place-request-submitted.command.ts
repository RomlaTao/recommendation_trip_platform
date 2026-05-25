export interface NotifyPlaceRequestSubmittedCommand {
  recipientUserId: string;
  requestId: string;
  placeName: string;
  requesterUserId: string;
}
