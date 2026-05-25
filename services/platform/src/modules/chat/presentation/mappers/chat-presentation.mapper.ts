import { ChatMessageMapper } from '../../application/mappers/chat-message.mapper.js';
import type { DirectConversationListItemModel } from '../../application/models/direct-conversation-list-item.model.js';
import type { MessageModel } from '../../application/models/message.model.js';
import type {
  ConversationDetailDto,
  DirectConversationListItemDto,
} from '../dtos/conversation-response.dto.js';
import type { MessageResponseDto } from '../dtos/message-response.dto.js';

export class ChatPresentationMapper {
  static toDirectConversationListItem(
    model: DirectConversationListItemModel,
  ): DirectConversationListItemDto {
    return {
      id: model.id,
      type: model.type,
      otherParticipant: {
        id: model.otherParticipant.id,
        displayName: model.otherParticipant.displayName,
        avatarUrl: model.otherParticipant.avatarUrl,
      },
      lastMessage: model.lastMessage
        ? {
            id: model.lastMessage.id,
            body: model.lastMessage.body,
            senderUserId: model.lastMessage.senderUserId,
            createdAt: model.lastMessage.createdAt.toISOString(),
          }
        : null,
      unreadCount: model.unreadCount,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  static toConversationDetail(
    model: DirectConversationListItemModel,
  ): ConversationDetailDto {
    return this.toDirectConversationListItem(model);
  }

  static toMessageResponse(model: MessageModel): MessageResponseDto {
    return ChatMessageMapper.toTransportPayload(model);
  }
}
