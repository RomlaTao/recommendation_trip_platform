import { TripDomainError } from './trip-domain.error.js';

export class TripConfirmEmptyError extends TripDomainError {
  constructor(message = 'trip_confirm_requires_at_least_one_item') {
    super(message, 409, 'Conflict');
  }
}
