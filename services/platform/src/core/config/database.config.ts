import { registerAs } from '@nestjs/config';

/**
 * Typed config namespace: 'database'
 *
 * Design rationale:
 * - `registerAs` scopes these values under the 'database' key, enabling
 *   strongly-typed injection via ConfigService.get<DatabaseConfig>('database').
 * - `synchronize` is intentionally limited to non-production environments.
 *   In production, schema changes must go through explicit TypeORM migrations
 *   to avoid accidental data loss.
 * - `autoLoadEntities: true` means modules only need to pass their entities
 *   to TypeOrmModule.forFeature() — no manual registration in this config.
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

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'recommendation_trip_db',
    autoLoadEntities: true,
    // Only auto-sync schema in development; use migrations in staging/prod
    synchronize: process.env.NODE_ENV !== 'production',
    // Disable SQL query logs by default; set DB_LOGGING=true to enable.
    logging: process.env.DB_LOGGING === 'true',
  }),
);
