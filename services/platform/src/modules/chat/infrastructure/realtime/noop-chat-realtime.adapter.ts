import { Injectable } from '@nestjs/common';
import type {
  ChatConversationReadPayload,
  ChatMessageNewPayload,
  ChatRealtimePort,
} from '../../application/ports/chat-realtime.port.js';

@Injectable()
export class NoopChatRealtimeAdapter implements ChatRealtimePort {
  async emitMessageNew(): Promise<void> {}

  async emitConversationRead(): Promise<void> {}
}
