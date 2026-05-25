import { registerAs } from '@nestjs/config';

export interface RealtimeConfig {
  enabled: boolean;
  corsOrigin: boolean | string | string[];
  redisAdapterEnabled: boolean;
}

function resolveCorsOrigin(): boolean | string | string[] {
  const raw = process.env.REALTIME_CORS_ORIGIN?.trim();
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return process.env.NODE_ENV === 'production' ? false : true;
}

export default registerAs(
  'realtime',
  (): RealtimeConfig => ({
    enabled: (process.env.REALTIME_ENABLED ?? 'true').toLowerCase() === 'true',
    corsOrigin: resolveCorsOrigin(),
    redisAdapterEnabled:
      (process.env.REALTIME_REDIS_ADAPTER_ENABLED ?? 'false').toLowerCase() ===
      'true',
  }),
);
