import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeConfig } from '../../../../core/realtime/config/realtime.config.js';
import {
  CHAT_CONVERSATION_READ_EVENT,
  CHAT_MESSAGE_NEW_EVENT,
  conversationRoom,
} from '../../chat.constants.js';
import type {
  ChatConversationReadPayload,
  ChatMessageNewPayload,
  ChatRealtimePort,
} from '../../application/ports/chat-realtime.port.js';
import { ChatServerHolder } from './chat-server.holder.js';

@Injectable()
export class SocketIoChatRealtimeAdapter implements ChatRealtimePort {
  private readonly logger = new Logger(SocketIoChatRealtimeAdapter.name);

  constructor(
    private readonly chatServerHolder: ChatServerHolder,
    private readonly configService: ConfigService,
  ) {}

  async emitMessageNew(
    conversationId: string,
    payload: ChatMessageNewPayload,
  ): Promise<void> {
    await this.emitToConversationRoom(
      conversationId,
      CHAT_MESSAGE_NEW_EVENT,
      payload,
    );
  }

  async emitConversationRead(
    conversationId: string,
    payload: ChatConversationReadPayload,
  ): Promise<void> {
    await this.emitToConversationRoom(
      conversationId,
      CHAT_CONVERSATION_READ_EVENT,
      payload,
    );
  }

  private async emitToConversationRoom(
    conversationId: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    if (!this.isEnabled() || !this.chatServerHolder.hasServer()) {
      return;
    }

    try {
      this.chatServerHolder
        .getServer()
        .to(conversationRoom(conversationId))
        .emit(event, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `chat emit failed conversation=${conversationId} event=${event}: ${msg}`,
      );
    }
  }

  private isEnabled(): boolean {
    return (
      this.configService.get<RealtimeConfig>('realtime')?.enabled ?? false
    );
  }
}
