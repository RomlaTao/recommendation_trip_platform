import { TripDomainError } from './trip-domain.error.js';

export class TripItemTimeOverlapError extends TripDomainError {
  constructor(message = 'trip_item_time_overlap') {
    super(message, 409, 'Conflict');
  }
}
