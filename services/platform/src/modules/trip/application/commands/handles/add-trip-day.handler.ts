export interface AddTripDayCommand {
  userId: string;
  tripId: string;
  dayIndex: number;
  date: string;
}

export abstract class AddTripDayHandler {
  abstract execute(command: AddTripDayCommand): Promise<{ dayId: string }>;
}
