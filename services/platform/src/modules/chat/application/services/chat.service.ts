import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../common/errors/app.error.js';
import {
  buildDirectConversationKey,
} from '../../chat.constants.js';
import {
  CHAT_REALTIME,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  USER_LOOKUP,
} from '../../chat.di-tokens.js';
import { ChatMessageMapper } from '../mappers/chat-message.mapper.js';
import type { CreateDirectConversationCommand } from '../commands/create-direct-conversation.command.js';
import type {
  MarkConversationReadCommand,
  MarkConversationReadResult,
} from '../commands/mark-conversation-read.command.js';
import type { SendMessageCommand } from '../commands/send-message.command.js';
import {
  ChatEmptyMessageError,
  ChatNotMemberError,
  ChatSelfDirectError,
} from '../errors/chat.errors.js';
import type { DirectConversationListItemModel } from '../models/direct-conversation-list-item.model.js';
import type { DirectInboxRowModel } from '../models/direct-conversation-list-item.model.js';
import type { MessageModel } from '../models/message.model.js';
import type { ChatRealtimePort } from '../ports/chat-realtime.port.js';
import type { ConversationRepositoryPort } from '../ports/conversation.repository.port.js';
import type { MessageRepositoryPort } from '../ports/message.repository.port.js';
import type { UserLookupPort } from '../ports/user-lookup.port.js';
import type {
  ListMessagesQuery,
  ListMessagesResult,
} from '../queries/list-messages.query.js';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepositoryPort,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepositoryPort,
    @Inject(USER_LOOKUP)
    private readonly userLookup: UserLookupPort,
    @Inject(CHAT_REALTIME)
    private readonly chatRealtime: ChatRealtimePort,
  ) {}

  async listMyConversations(
    userId: string,
  ): Promise<DirectConversationListItemModel[]> {
    const rows = await this.conversationRepository.listDirectInboxForUser(
      userId,
    );
    return this.enrichInboxRows(rows);
  }

  async getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<DirectConversationListItemModel> {
    await this.assertMember(conversationId, userId);

    const row = await this.conversationRepository.findDirectInboxRow(
      conversationId,
      userId,
    );
    if (!row) {
      throw new ResourceNotFoundError('conversation_not_found');
    }

    const [item] = await this.enrichInboxRows([row]);
    return item;
  }

  async createOrGetDirectConversation(
    userId: string,
    command: CreateDirectConversationCommand,
  ): Promise<DirectConversationListItemModel> {
    if (userId === command.otherUserId) {
      throw new ChatSelfDirectError();
    }

    const otherExists = await this.userLookup.exists(command.otherUserId);
    if (!otherExists) {
      throw new ResourceNotFoundError('user_not_found');
    }

    const directKey = buildDirectConversationKey(userId, command.otherUserId);
    const conversation = await this.conversationRepository.findOrCreateDirect({
      userIdA: userId,
      userIdB: command.otherUserId,
      directKey,
    });

    return this.getConversationDetail(userId, conversation.id);
  }

  async listMessages(
    userId: string,
    conversationId: string,
    query: ListMessagesQuery,
  ): Promise<ListMessagesResult<MessageModel>> {
    await this.assertMember(conversationId, userId);

    const { items, total } = await this.messageRepository.listByConversation({
      conversationId,
      page: query.page,
      limit: query.limit,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    command: SendMessageCommand,
  ): Promise<MessageModel> {
    await this.assertMember(conversationId, userId);

    const body = command.body.trim();
    if (body.length === 0) {
      throw new ChatEmptyMessageError();
    }

    const message = await this.messageRepository.append({
      conversationId,
      senderUserId: userId,
      body,
    });

    await this.chatRealtime.emitMessageNew(
      conversationId,
      ChatMessageMapper.toTransportPayload(message),
    );

    return message;
  }

  async markConversationRead(
    userId: string,
    conversationId: string,
    command: MarkConversationReadCommand,
  ): Promise<MarkConversationReadResult> {
    await this.assertMember(conversationId, userId);

    if (command.messageId) {
      const message = await this.messageRepository.findByIdInConversation(
        conversationId,
        command.messageId,
      );
      if (!message) {
        throw new ResourceNotFoundError('message_not_found');
      }
    }

    const result = await this.conversationRepository.markRead(
      conversationId,
      userId,
      command.messageId,
    );

    await this.chatRealtime.emitConversationRead(conversationId, {
      conversationId: result.conversationId,
      userId: result.userId,
      lastReadAt: result.lastReadAt.toISOString(),
      lastReadMessageId: result.lastReadMessageId,
    });

    return result;
  }

  async assertMember(conversationId: string, userId: string): Promise<void> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new ResourceNotFoundError('conversation_not_found');
    }

    const isMember = await this.conversationRepository.isMember(
      conversationId,
      userId,
    );
    if (!isMember) {
      throw new ChatNotMemberError();
    }
  }

  private async enrichInboxRows(
    rows: DirectInboxRowModel[],
  ): Promise<DirectConversationListItemModel[]> {
    if (rows.length === 0) {
      return [];
    }

    const profiles = await this.userLookup.findPublicProfiles(
      rows.map((row) => row.otherUserId),
    );
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    return rows.map((row) => {
      const otherParticipant = profileById.get(row.otherUserId);
      if (!otherParticipant) {
        throw new ResourceNotFoundError('user_not_found');
      }

      return {
        id: row.conversationId,
        type: row.type,
        otherParticipant,
        lastMessage: row.lastMessage,
        unreadCount: row.unreadCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }
}
