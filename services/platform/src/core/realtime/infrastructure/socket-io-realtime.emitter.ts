import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeConfig } from '../config/realtime.config.js';
import { userRoom } from '../realtime.constants.js';
import { RealtimeEmitterPort } from '../ports/realtime-emitter.port.js';
import { RealtimeServerHolder } from './realtime-server.holder.js';

@Injectable()
export class SocketIoRealtimeEmitter implements RealtimeEmitterPort {
  private readonly logger = new Logger(SocketIoRealtimeEmitter.name);

  constructor(
    private readonly serverHolder: RealtimeServerHolder,
    private readonly configService: ConfigService,
  ) {}

  async emitToUser(
    userId: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    await this.emitToRoom(userRoom(userId), event, payload);
  }

  async emitToRoom(
    room: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    if (!this.isEnabled() || !this.serverHolder.hasServer()) {
      return;
    }
    try {
      this.serverHolder.getServer().to(room).emit(event, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`emit failed room=${room} event=${event}: ${msg}`);
    }
  }

  private isEnabled(): boolean {
    return (
      this.configService.get<RealtimeConfig>('realtime')?.enabled ?? false
    );
  }
}
