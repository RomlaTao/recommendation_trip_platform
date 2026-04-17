export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly error = 'Internal Server Error',
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message = 'resource_not_found') {
    super(message, 404, 'Not Found');
  }
}
