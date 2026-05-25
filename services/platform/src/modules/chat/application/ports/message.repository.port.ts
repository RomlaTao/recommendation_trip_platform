import type { MessageModel } from '../models/message.model.js';

export interface AppendMessageInput {
  conversationId: string;
  senderUserId: string;
  body: string;
}

export interface ListMessagesByConversationInput {
  conversationId: string;
  page: number;
  limit: number;
}

export interface ListMessagesByConversationResult {
  items: MessageModel[];
  total: number;
}

export interface MessageRepositoryPort {
  append(input: AppendMessageInput): Promise<MessageModel>;
  listByConversation(
    input: ListMessagesByConversationInput,
  ): Promise<ListMessagesByConversationResult>;
  findLatestInConversation(conversationId: string): Promise<MessageModel | null>;
  findByIdInConversation(
    conversationId: string,
    messageId: string,
  ): Promise<MessageModel | null>;
}
