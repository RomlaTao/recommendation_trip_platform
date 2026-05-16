export interface AddTripItemCommand {
  userId: string;
  tripId: string;
  dayId: string;
  placeId: string;
  type: string;
  startTime: string;
  endTime: string;
  note?: string | null;
  sortOrder?: number;
}

export abstract class AddTripItemHandler {
  abstract execute(command: AddTripItemCommand): Promise<void>;
}
