import type { ConversationModel } from '../models/conversation.model.js';
import type { DirectInboxRowModel } from '../models/direct-conversation-list-item.model.js';
import type { MarkConversationReadResult } from '../commands/mark-conversation-read.command.js';

export interface FindOrCreateDirectInput {
  userIdA: string;
  userIdB: string;
  directKey: string;
}

export interface ConversationRepositoryPort {
  findById(id: string): Promise<ConversationModel | null>;
  findDirectByKey(directKey: string): Promise<ConversationModel | null>;
  findOrCreateDirect(input: FindOrCreateDirectInput): Promise<ConversationModel>;
  listDirectInboxForUser(userId: string): Promise<DirectInboxRowModel[]>;
  findDirectInboxRow(
    conversationId: string,
    userId: string,
  ): Promise<DirectInboxRowModel | null>;
  isMember(conversationId: string, userId: string): Promise<boolean>;
  markRead(
    conversationId: string,
    userId: string,
    messageId?: string,
  ): Promise<MarkConversationReadResult>;
}
