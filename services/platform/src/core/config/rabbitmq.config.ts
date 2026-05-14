import { registerAs } from '@nestjs/config';

export interface RabbitMqConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Topic exchange for place → ML projection (must match ml-model-service consumer). */
  placeEventsExchange: string;
  /** Default routing key for projection payloads. */
  placeProjectionRoutingKey: string;
  /** Poll interval for outbox relay (ms). */
  relayIntervalMs: number;
  /** Max rows claimed per relay tick. */
  relayBatchSize: number;
  /** When false, relay loop does not start (local dev without broker). */
  relayEnabled: boolean;
}

export default registerAs(
  'rabbitmq',
  (): RabbitMqConfig => ({
    host: process.env.RABBITMQ_HOST ?? '',
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    user: process.env.RABBITMQ_USER ?? 'guest',
    password: process.env.RABBITMQ_PASSWORD ?? 'guest',
    placeEventsExchange:
      process.env.PLACE_ML_RABBITMQ_EXCHANGE ?? 'place.events',
    placeProjectionRoutingKey:
      process.env.PLACE_ML_RABBITMQ_ROUTING_KEY ?? 'place.projection.v1',
    relayIntervalMs: parseInt(
      process.env.PLACE_ML_OUTBOX_RELAY_INTERVAL_MS ?? '2000',
      10,
    ),
    relayBatchSize: parseInt(
      process.env.PLACE_ML_OUTBOX_RELAY_BATCH_SIZE ?? '50',
      10,
    ),
    relayEnabled:
      (process.env.PLACE_ML_OUTBOX_RELAY_ENABLED ?? 'true').toLowerCase() ===
        'true' && Boolean((process.env.RABBITMQ_HOST ?? '').trim()),
  }),
);
