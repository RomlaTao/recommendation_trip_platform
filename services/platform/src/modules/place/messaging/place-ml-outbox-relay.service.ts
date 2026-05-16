import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { connect } from 'amqplib';
import { DataSource } from 'typeorm';
import type { RabbitMqConfig } from '../../../core/config/rabbitmq.config.js';

const MAX_PUBLISH_ATTEMPTS = 15;
const STUCK_PROCESSING_MINUTES = 15;

/** Narrow surface used from amqplib (avoids version skew between runtime and @types). */
interface AmqpChannelLike {
  assertExchange(
    exchange: string,
    type: string,
    options: { durable: boolean },
  ): Promise<unknown>;
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: { persistent?: boolean; contentType?: string },
  ): boolean;
  close(): Promise<void>;
}

interface AmqpConnectionLike {
  createChannel(): Promise<AmqpChannelLike>;
  on(event: string, handler: (err: Error) => void): this;
  close(): Promise<void>;
}

interface ClaimedOutboxRow {
  id: string;
  routingKey: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class PlaceMlOutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaceMlOutboxRelayService.name);
  private timer?: NodeJS.Timeout;
  private connection?: AmqpConnectionLike;
  private channel?: AmqpChannelLike;

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    const mq = this.configService.get<RabbitMqConfig>('rabbitmq');
    if (!mq?.relayEnabled) {
      this.logger.log(
        'Place ML outbox relay disabled (set RABBITMQ_HOST and PLACE_ML_OUTBOX_RELAY_ENABLED=true).',
      );
      return;
    }
    this.logger.log(
      `Place ML outbox relay enabled (interval ${mq.relayIntervalMs}ms, batch ${mq.relayBatchSize}).`,
    );
    void this.tick();
    this.timer = setInterval(() => void this.tick(), mq.relayIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    void this.channel?.close().catch(() => undefined);
    void this.connection?.close().catch(() => undefined);
  }

  private async resetStaleProcessing(): Promise<void> {
    await this.dataSource.query(
      `
      UPDATE "place_ml_outbox"
      SET "status" = 'PENDING', "lastError" = 'stale_processing_reset'
      WHERE "status" = 'PROCESSING'
        AND "createdAt" < NOW() - ($1 * INTERVAL '1 minute')
      `,
      [STUCK_PROCESSING_MINUTES],
    );
  }

  private async claimBatch(limit: number): Promise<ClaimedOutboxRow[]> {
    const raw: unknown = await this.dataSource.query(
      `
      UPDATE "place_ml_outbox" AS o
      SET "status" = 'PROCESSING'
      FROM (
        SELECT "id"
        FROM "place_ml_outbox"
        WHERE "status" = 'PENDING'
        ORDER BY "createdAt" ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      ) AS sub
      WHERE o."id" = sub."id"
      RETURNING o."id", o."routingKey", o."payload"
      `,
      [limit],
    );
    return raw as ClaimedOutboxRow[];
  }

  private async markPublished(id: string): Promise<void> {
    await this.dataSource.query(
      `
      UPDATE "place_ml_outbox"
      SET "status" = 'PUBLISHED', "publishedAt" = NOW(), "lastError" = NULL
      WHERE "id" = $1
      `,
      [id],
    );
  }

  private async markPublishFailure(id: string, errorMessage: string): Promise<void> {
    await this.dataSource.query(
      `
      UPDATE "place_ml_outbox"
      SET
        "attemptCount" = "attemptCount" + 1,
        "status" = CASE
          WHEN "attemptCount" + 1 >= $2 THEN 'FAILED'
          ELSE 'PENDING'
        END,
        "lastError" = $3
      WHERE "id" = $1
      `,
      [id, MAX_PUBLISH_ATTEMPTS, errorMessage],
    );
  }

  private async revertToPending(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.dataSource.query(
      `
      UPDATE "place_ml_outbox"
      SET "status" = 'PENDING', "lastError" = 'broker_unavailable'
      WHERE "id" = ANY($1::uuid[]) AND "status" = 'PROCESSING'
      `,
      [ids],
    );
  }

  private async ensureChannel(
    mq: RabbitMqConfig,
  ): Promise<{ channel: AmqpChannelLike; exchange: string } | null> {
    if (!mq.host) return null;
    const url = `amqp://${encodeURIComponent(mq.user)}:${encodeURIComponent(
      mq.password,
    )}@${mq.host}:${mq.port}/`;
    if (!this.connection) {
      const conn = (await connect(url)) as AmqpConnectionLike;
      this.connection = conn;
      conn.on('error', (err: Error) => {
        this.logger.warn(`RabbitMQ connection error: ${err.message}`);
        this.connection = undefined;
        this.channel = undefined;
      });
    }
    const conn = this.connection;
    if (!conn) {
      return null;
    }
    if (!this.channel) {
      this.channel = await conn.createChannel();
      await this.channel.assertExchange(mq.placeEventsExchange, 'topic', {
        durable: true,
      });
    }
    const ch = this.channel;
    if (!ch) {
      return null;
    }
    return { channel: ch, exchange: mq.placeEventsExchange };
  }

  private async tick(): Promise<void> {
    const mq = this.configService.get<RabbitMqConfig>('rabbitmq');
    if (!mq?.relayEnabled) return;

    try {
      await this.resetStaleProcessing();
      const claimed = await this.claimBatch(mq.relayBatchSize);
      if (claimed.length === 0) {
        return;
      }

      let channelBundle: { channel: AmqpChannelLike; exchange: string } | null;
      try {
        channelBundle = await this.ensureChannel(mq);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`RabbitMQ connect failed: ${msg}`);
        await this.revertToPending(claimed.map((c) => c.id));
        return;
      }

      if (!channelBundle) {
        await this.revertToPending(claimed.map((c) => c.id));
        return;
      }

      const { channel, exchange } = channelBundle;
      for (const row of claimed) {
        try {
          const body = Buffer.from(JSON.stringify(row.payload));
          const published = channel.publish(exchange, row.routingKey, body, {
            persistent: true,
            contentType: 'application/json',
          });
          if (!published) {
            await this.markPublishFailure(
              row.id,
              'channel_write_buffer_full_retry',
            );
            continue;
          }
          await this.markPublished(row.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await this.markPublishFailure(row.id, msg);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Outbox relay tick failed: ${msg}`);
    }
  }
}
