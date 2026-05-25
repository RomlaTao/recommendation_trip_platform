import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import {
  CONVERSATION_TYPES,
  type ConversationType,
} from '../../chat.constants.js';

export class ChatParticipantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  displayName: string;

  @ApiPropertyOptional({ nullable: true, example: 'https://example.com/avatar.png' })
  avatarUrl: string | null;
}

export class LastMessagePreviewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ format: 'uuid' })
  senderUserId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class DirectConversationListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: Object.values(CONVERSATION_TYPES) })
  type: ConversationType;

  @ApiProperty({ type: ChatParticipantDto })
  otherParticipant: ChatParticipantDto;

  @ApiPropertyOptional({ type: LastMessagePreviewDto, nullable: true })
  lastMessage: LastMessagePreviewDto | null;

  @ApiProperty({ example: 0 })
  unreadCount: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class ConversationDetailDto extends DirectConversationListItemDto {}

export class DirectConversationListResponseDto {
  @ApiProperty({ type: [DirectConversationListItemDto] })
  items: DirectConversationListItemDto[];
}

export class MarkConversationReadDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  messageId?: string;
}

export class MarkConversationReadResponseDto {
  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'date-time' })
  lastReadAt: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastReadMessageId: string | null;
}
