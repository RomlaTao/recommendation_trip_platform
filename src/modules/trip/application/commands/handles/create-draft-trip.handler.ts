export interface CreateDraftTripCommand {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  days: Array<{
    dayIndex: number;
    date: string;
    items: Array<{
      placeId: string;
      type: string;
      startTime: string;
      endTime: string;
      note?: string | null;
      sortOrder?: number;
    }>;
  }>;
}

export interface CreateDraftTripResult {
  id: string;
}

export abstract class CreateDraftTripHandler {
  abstract execute(command: CreateDraftTripCommand): Promise<CreateDraftTripResult>;
}
