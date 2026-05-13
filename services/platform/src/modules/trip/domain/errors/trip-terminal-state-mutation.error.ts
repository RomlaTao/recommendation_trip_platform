import { TripDomainError } from './trip-domain.error.js';

export class TripTerminalStateMutationError extends TripDomainError {
  constructor(message = 'trip_terminal_state_mutation_not_allowed') {
    super(message, 409, 'Conflict');
  }
}
