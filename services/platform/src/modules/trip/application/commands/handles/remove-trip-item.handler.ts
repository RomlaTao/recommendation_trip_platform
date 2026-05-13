export interface RemoveTripItemCommand {
  userId: string;
  tripId: string;
  dayId: string;
  itemId: string;
}

export abstract class RemoveTripItemHandler {
  abstract execute(command: RemoveTripItemCommand): Promise<void>;
}
