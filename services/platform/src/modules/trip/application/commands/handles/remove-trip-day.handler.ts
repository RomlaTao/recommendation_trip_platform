export interface RemoveTripDayCommand {
  userId: string;
  tripId: string;
  dayId: string;
}

export abstract class RemoveTripDayHandler {
  abstract execute(command: RemoveTripDayCommand): Promise<void>;
}
