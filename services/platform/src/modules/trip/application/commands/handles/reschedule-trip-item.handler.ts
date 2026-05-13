export interface RescheduleTripItemCommand {
  userId: string;
  tripId: string;
  dayId: string;
  itemId: string;
  startTime: string;
  endTime: string;
}

export abstract class RescheduleTripItemHandler {
  abstract execute(command: RescheduleTripItemCommand): Promise<void>;
}
