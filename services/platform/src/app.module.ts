import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig, {
  DatabaseConfig,
} from './core/config/database.config.js';
import tokenConfig from './core/config/token.config.js';
import queueConfig, { QueueConfig } from './core/config/queue.config.js';
import emailConfig from './core/config/email.config.js';
import rabbitmqConfig from './core/config/rabbitmq.config.js';
import { AuthModule } from './core/auth/auth.module.js';
import { UsersModule } from './modules/user/users.module.js';
import { SeedOnStartModule } from './core/database/seeds/seed-on-start.module.js';
import { PlaceModule } from './modules/place/place.module.js';
import { TripModule } from './modules/trip/trip.module.js';

/**
 * App Module — Root of the dependency graph
 *
 * Design rationale:
 * - ConfigModule is loaded globally (isGlobal: true) so every module can inject
 *   ConfigService without re-importing ConfigModule — avoids circular imports.
 * - TypeOrmModule.forRootAsync reads the 'database' config namespace, keeping
 *   all DB configuration in one place (config/database.config.ts).
 * - JWT guards are declared per-controller/per-route to keep dependencies
 *   explicit and make access control easier to reason about at feature level.
 * - SeedOnStartModule is imported only when SEED_ON_START=true — runs idempotent
 *   seeders via OnApplicationBootstrap, safe to leave on in development.
 */
@Module({
  imports: [
    // ── Global configuration ──────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // Register typed config namespaces — accessed via ConfigService.get('database')
      load: [databaseConfig, tokenConfig, queueConfig, emailConfig, rabbitmqConfig],
      cache: true,
    }),

    // ── Database ──────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DatabaseConfig>('database')!;
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadEntities: true,
          synchronize: db.synchronize,
          logging: db.logging,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const queue = configService.get<QueueConfig>('queue')!;
        return {
          redis: {
            host: queue.redisHost,
            port: queue.redisPort,
            password: queue.redisPassword || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    PlaceModule,
    TripModule,

    // ── Startup seeding (development only) ────────────────────────────────────
    ...(process.env.SEED_ON_START === 'true' ? [SeedOnStartModule] : []),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
