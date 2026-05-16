import { registerAs } from '@nestjs/config';

/**
 * Typed config namespace: 'database'
 *
 * Environment variables (semantic):
 * - `PLATFORM_DB_*` — NestJS / TypeORM connection to the **platform** database.
 * Legacy `DB_*` is still read as fallback when `PLATFORM_DB_*` is unset.
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  autoLoadEntities: boolean;
  synchronize: boolean;
  logging: boolean;
}

function firstEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: firstEnv(['PLATFORM_DB_HOST', 'DB_HOST']) ?? 'localhost',
    port: parseInt(
      firstEnv(['PLATFORM_DB_PORT', 'DB_PORT']) ?? '5432',
      10,
    ),
    username:
      firstEnv(['PLATFORM_DB_USERNAME', 'DB_USERNAME']) ?? 'postgres',
    password:
      firstEnv(['PLATFORM_DB_PASSWORD', 'DB_PASSWORD']) ?? 'postgres',
    database:
      firstEnv(['PLATFORM_DB_DATABASE', 'DB_DATABASE']) ??
      'recommendation_trip_db',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    logging:
      firstEnv(['PLATFORM_DB_LOGGING', 'DB_LOGGING']) === 'true' ||
      process.env.DB_LOGGING === 'true',
  }),
);
