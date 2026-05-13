import { TripDomainError } from './trip-domain.error.js';

export class TripInvalidStateTransitionError extends TripDomainError {
  constructor(message = 'trip_invalid_state_transition') {
    super(message, 409, 'Conflict');
  }
}
