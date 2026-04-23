export const NOTIFICATION_QUEUE_NAME = 'notification';

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'SEND_EMAIL',
} as const;

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'EMAIL',
} as const;

export const NOTIFICATION_TEMPLATES = {
  AUTH_VERIFY_EMAIL: 'AUTH_VERIFY_EMAIL',
} as const;

export const NOTIFICATION_STATUSES = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
} as const;
