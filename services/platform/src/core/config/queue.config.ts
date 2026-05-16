import { registerAs } from '@nestjs/config';

export interface QueueConfig {
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
}

export default registerAs(
  'queue',
  (): QueueConfig => ({
    redisHost: process.env.QUEUE_REDIS_HOST ?? '127.0.0.1',
    redisPort: parseInt(process.env.QUEUE_REDIS_PORT ?? '6379', 10),
    redisPassword: process.env.QUEUE_REDIS_PASSWORD,
  }),
);
