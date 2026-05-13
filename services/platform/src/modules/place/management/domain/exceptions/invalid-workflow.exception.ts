import { AppError } from '../../../../../common/errors/app.error.js';

export class InvalidWorkflowException extends AppError {
  constructor(message = 'invalid_place_workflow_transition') {
    super(message, 409, 'Conflict');
  }
}

export class PlaceOwnershipException extends AppError {
  constructor(message = 'place_ownership_violation') {
    super(message, 403, 'Forbidden');
  }
}

export class PlaceDeletedException extends AppError {
  constructor(message = 'place_already_deleted') {
    super(message, 409, 'Conflict');
  }
}

export class PlaceNotDeletedException extends AppError {
  constructor(message = 'place_is_not_deleted') {
    super(message, 409, 'Conflict');
  }
}
