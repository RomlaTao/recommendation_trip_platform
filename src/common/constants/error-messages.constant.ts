export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  INVALID_CREDENTIALS: 'invalid_credentials',
  RESOURCE_NOT_FOUND: 'resource_not_found',
  VALIDATION_FAILED: 'validation_failed',
  CONFLICT: 'conflict',
  INTERNAL_SERVER_ERROR: 'internal_server_error',
  FAILED_TO_RESTORE_USER: 'failed_to_restore_user',
} as const;

export type ErrorMessageCode =
  (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
