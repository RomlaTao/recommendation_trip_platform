import {
  ClassSerializerInterceptor,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import type { QueueConfig } from './core/config/queue.config.js';
import type { RealtimeConfig } from './core/realtime/config/realtime.config.js';
import { HttpExceptionFilter } from './core/filters/global-exception.filter.js';
import { RedisIoAdapter } from './core/realtime/infrastructure/redis-io.adapter.js';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './core/interceptors/transform.interceptor.js';

/**
 * Applies Express/Nest middleware (app.use / enableCors).
 */
function applyExpressMiddleware(
  app: INestApplication,
  configService: ConfigService,
): void {
  // ── CORS ────────────────────────────────────────────────────────────────────
  // Adjust origins when deploying; keep open for local development.
  app.enableCors({
    origin:
      configService.get<string>('NODE_ENV') === 'production'
        ? false // Configure explicit allowed origins in production
        : true,
    credentials: true,
  });
}

/**
 * Applies global Nest providers (pipes / filters / interceptors / prefix).
 */
function setupGlobalAppConfig(
  app: INestApplication,
  configService: ConfigService,
  reflector: Reflector,
): void {
  // ── Global Pipes ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties not defined in the DTO class (prevents over-posting)
      whitelist: true,
      // Reject requests that include unknown properties (fail fast)
      forbidNonWhitelisted: true,
      // Auto-transform payload primitives to DTO property types
      transform: true,
      transformOptions: {
        // Honour @Transform() decorators during plain→class conversion
        enableImplicitConversion: false,
      },
    }),
  );

  // ── Global Filters ──────────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global Interceptors ─────────────────────────────────────────────────────
  // Order: logging -> serialization -> transform
  // - LoggingInterceptor measures end-to-end request latency.
  // - ClassSerializerInterceptor strips @Exclude() fields from entities.
  // - TransformInterceptor wraps the clean payload in API envelope format.
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );

  // ── Global Route Prefix ─────────────────────────────────────────────────────
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);
}

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Recommendation Trip Platform API')
    .setDescription('API docs for Recommendation Trip Platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

/**
 * Application bootstrap
 */
async function configureRealtimeAdapter(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  const realtime = configService.get<RealtimeConfig>('realtime');
  if (!realtime?.enabled || !realtime.redisAdapterEnabled) {
    return;
  }
  const queue = configService.get<QueueConfig>('queue');
  if (!queue) {
    return;
  }
  const adapter = new RedisIoAdapter(app, queue);
  await adapter.connectToRedis();
  app.useWebSocketAdapter(adapter);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  await configureRealtimeAdapter(app, configService);

  applyExpressMiddleware(app, configService);
  setupGlobalAppConfig(app, configService, reflector);
  setupSwagger(app);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Api docs is running on: http://localhost:${port}/api-docs`);
}

void bootstrap();
