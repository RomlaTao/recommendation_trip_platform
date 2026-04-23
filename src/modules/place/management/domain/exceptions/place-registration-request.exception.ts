import { AppError } from '../../../../../common/errors/app.error.js';

export class PlaceRegistrationRequestForbiddenError extends AppError {
  constructor(message = 'place_registration_request_forbidden') {
    super(message, 403, 'Forbidden');
  }
}

export class PlaceRegistrationRequestInvalidStateError extends AppError {
  constructor(message = 'place_registration_request_invalid_state') {
    super(message, 409, 'Conflict');
  }
}
