export interface UpdateTripItemCommand {
  userId: string;
  tripId: string;
  dayId: string;
  itemId: string;
  placeId?: string;
  type?: string;
  note?: string | null;
  sortOrder?: number;
}

export abstract class UpdateTripItemHandler {
  abstract execute(command: UpdateTripItemCommand): Promise<void>;
}
