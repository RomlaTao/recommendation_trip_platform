import { AppError } from '../../../../common/errors/app.error';

export class TripDomainError extends AppError {
  constructor(message: string, statusCode = 409, error = 'Conflict') {
    super(message, statusCode, error);
  }
}
