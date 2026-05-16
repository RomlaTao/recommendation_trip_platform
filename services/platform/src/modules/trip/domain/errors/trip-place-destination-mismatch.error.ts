import { TripDomainError } from './trip-domain.error.js';

export class TripPlaceDestinationMismatchError extends TripDomainError {
  constructor(message = 'place_destination_mismatch') {
    super(message, 400, 'Bad Request');
  }
}
