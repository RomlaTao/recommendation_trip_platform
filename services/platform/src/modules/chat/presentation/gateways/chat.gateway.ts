import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { RealtimeConfig } from '../../../../core/realtime/config/realtime.config.js';
import { WsAuthService } from '../../../../core/realtime/application/ws-auth.service.js';
import { ChatService } from '../../application/services/chat.service.js';
import {
  CHAT_WS_EVENTS,
  conversationRoom,
} from '../../chat.constants.js';
import { CHAT_SERVER_REGISTRY } from '../../chat.di-tokens.js';
import type { ChatServerRegistryPort } from '../../application/ports/chat-server-registry.port.js';

function gatewayCorsFromEnv(): {
  origin: boolean | string | string[];
  credentials: boolean;
} {
  const raw = process.env.REALTIME_CORS_ORIGIN?.trim();
  const origin = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : process.env.NODE_ENV === 'production'
      ? false
      : true;
  return { origin, credentials: true };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: gatewayCorsFromEnv(),
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly wsAuthService: WsAuthService,
    private readonly chatService: ChatService,
    @Inject(CHAT_SERVER_REGISTRY)
    private readonly chatServerRegistry: ChatServerRegistryPort,
  ) {}

  afterInit(): void {
    this.chatServerRegistry.bindNamespaceServer(this.server);
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
      this.logger.debug(
        `chat client connected user=${user.sub} id=${client.id}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`chat connection rejected id=${client.id}: ${msg}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.user?.sub;
    if (userId) {
      this.logger.debug(
        `chat client disconnected user=${userId} id=${client.id}`,
      );
    }
  }

  @SubscribeMessage(CHAT_WS_EVENTS.JOIN_CONVERSATION)
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<{ ok: boolean }> {
    const userId = client.data?.user?.sub as string | undefined;
    if (!userId) {
      client.disconnect(true);
      return { ok: false };
    }

    const conversationId = body?.conversationId?.trim();
    if (!conversationId) {
      return { ok: false };
    }

    await this.chatService.assertMember(conversationId, userId);
    await client.join(conversationRoom(conversationId));
    return { ok: true };
  }
}
