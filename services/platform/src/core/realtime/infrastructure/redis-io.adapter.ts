import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';
import type { QueueConfig } from '../../config/queue.config.js';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplication,
    private readonly queue: QueueConfig,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = this.buildRedisUrl();
    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      this.logger.warn(`Redis pub client error: ${err.message}`);
    });
    subClient.on('error', (err) => {
      this.logger.warn(`Redis sub client error: ${err.message}`);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter connected');
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }

  private buildRedisUrl(): string {
    const host = this.queue.redisHost || '127.0.0.1';
    const port = this.queue.redisPort || 6379;
    const password = this.queue.redisPassword;
    if (password) {
      return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
  }
}
