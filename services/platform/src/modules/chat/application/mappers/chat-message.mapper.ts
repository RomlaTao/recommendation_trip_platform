import type { ChatMessageNewPayload } from '../ports/chat-realtime.port.js';
import type { MessageModel } from '../models/message.model.js';

export class ChatMessageMapper {
  static toTransportPayload(model: MessageModel): ChatMessageNewPayload {
    return {
      id: model.id,
      conversationId: model.conversationId,
      senderUserId: model.senderUserId,
      body: model.body,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }
}
