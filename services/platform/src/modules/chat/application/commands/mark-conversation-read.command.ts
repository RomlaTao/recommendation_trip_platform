export interface MarkConversationReadCommand {
  messageId?: string;
}

export interface MarkConversationReadResult {
  conversationId: string;
  userId: string;
  lastReadAt: Date;
  lastReadMessageId: string | null;
}
