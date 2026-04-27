export interface UpdateTripDayCommand {
  userId: string;
  tripId: string;
  dayId: string;
  dayIndex?: number;
  date?: string;
}

export abstract class UpdateTripDayHandler {
  abstract execute(command: UpdateTripDayCommand): Promise<void>;
}
