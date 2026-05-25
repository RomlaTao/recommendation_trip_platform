import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { RealtimeConfig } from '../config/realtime.config.js';
import { userRoom } from '../realtime.constants.js';
import { ConnectionRegistryService } from '../application/connection-registry.service.js';
import { WsAuthService } from '../application/ws-auth.service.js';
import { RealtimeServerHolder } from './realtime-server.holder.js';

function gatewayCorsFromEnv(): { origin: boolean | string | string[]; credentials: boolean } {
  const raw = process.env.REALTIME_CORS_ORIGIN?.trim();
  const origin = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : process.env.NODE_ENV === 'production'
      ? false
      : true;
  return { origin, credentials: true };
}

@WebSocketGateway({
  cors: gatewayCorsFromEnv(),
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly wsAuthService: WsAuthService,
    private readonly connectionRegistry: ConnectionRegistryService,
    private readonly serverHolder: RealtimeServerHolder,
  ) {}

  afterInit(): void {
    this.serverHolder.setServer(this.server);
    this.logger.log('Socket.IO realtime gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    const realtime = this.configService.get<RealtimeConfig>('realtime');
    if (!realtime?.enabled) {
      client.disconnect(true);
      return;
    }

    try {
      const user = await this.wsAuthService.authenticate(client);
      client.data.user = user;
      await client.join(userRoom(user.sub));
      this.connectionRegistry.register(user.sub, client.id);
      this.logger.debug(`client connected user=${user.sub} id=${client.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`connection rejected id=${client.id}: ${msg}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.connectionRegistry.unregister(client.id);
    const userId = client.data?.user?.sub;
    if (userId) {
      this.logger.debug(`client disconnected user=${userId} id=${client.id}`);
    }
  }
}
