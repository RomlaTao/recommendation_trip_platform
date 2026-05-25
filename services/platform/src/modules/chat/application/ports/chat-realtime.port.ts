export interface ChatMessageNewPayload {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationReadPayload {
  conversationId: string;
  userId: string;
  lastReadAt: string;
  lastReadMessageId: string | null;
}

export interface ChatRealtimePort {
  emitMessageNew(
    conversationId: string,
    payload: ChatMessageNewPayload,
  ): Promise<void>;
  emitConversationRead(
    conversationId: string,
    payload: ChatConversationReadPayload,
  ): Promise<void>;
}
