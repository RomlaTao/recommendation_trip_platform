import { AppError } from '../../../../../common/errors/app.error.js';

export class ReviewForbiddenError extends AppError {
  constructor() {
    super('review_forbidden', 403, 'Forbidden');
  }
}
