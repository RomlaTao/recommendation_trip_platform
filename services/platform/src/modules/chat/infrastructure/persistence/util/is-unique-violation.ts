import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

interface DriverErrorShape {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(
  err: unknown,
  constraintName?: string,
): boolean {
  if (!(err instanceof QueryFailedError)) {
    return false;
  }
  const driverError = (err as QueryFailedError & { driverError?: DriverErrorShape })
    .driverError;
  if (!driverError || driverError.code !== POSTGRES_UNIQUE_VIOLATION) {
    return false;
  }
  if (constraintName && driverError.constraint !== constraintName) {
    return false;
  }
  return true;
}
