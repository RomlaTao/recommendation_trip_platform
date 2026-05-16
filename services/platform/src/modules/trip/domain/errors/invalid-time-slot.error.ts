import { TripDomainError } from './trip-domain.error.js';

export class InvalidTimeSlotError extends TripDomainError {
  constructor(message = 'invalid_time_slot') {
    super(message, 400, 'Bad Request');
  }
}
