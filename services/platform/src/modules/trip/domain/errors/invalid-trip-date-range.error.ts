import { TripDomainError } from './trip-domain.error.js';

export class InvalidTripDateRangeError extends TripDomainError {
  constructor(message = 'invalid_trip_date_range') {
    super(message, 400, 'Bad Request');
  }
}
