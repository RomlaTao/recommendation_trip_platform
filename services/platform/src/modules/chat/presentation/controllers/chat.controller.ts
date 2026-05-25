import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../../common/interfaces/jwt-payload.interface.js';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard.js';
import { ChatService } from '../../application/services/chat.service.js';
import {
  ConversationDetailDto,
  DirectConversationListItemDto,
  DirectConversationListResponseDto,
  MarkConversationReadDto,
  MarkConversationReadResponseDto,
} from '../dtos/conversation-response.dto.js';
import { CreateDirectConversationDto } from '../dtos/create-direct-conversation.dto.js';
import { ListMessagesQueryDto } from '../dtos/list-messages.query.dto.js';
import {
  MessageListResponseDto,
  MessageResponseDto,
} from '../dtos/message-response.dto.js';
import { SendMessageDto } from '../dtos/send-message.dto.js';
import { ChatPresentationMapper } from '../mappers/chat-presentation.mapper.js';

@ApiTags('Chat')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(JwtAuthGuard)
@Controller('chat/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'List direct conversations for the current user' })
  @ApiOkResponse({ type: DirectConversationListResponseDto })
  async list(
    @CurrentUser() user: JwtPayload,
  ): Promise<DirectConversationListResponseDto> {
    const conversations = await this.chatService.listMyConversations(user.sub);
    return {
      items: conversations.map((item) =>
        ChatPresentationMapper.toDirectConversationListItem(item),
      ),
    };
  }

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or return a direct conversation' })
  @ApiCreatedResponse({ type: DirectConversationListItemDto })
  async createDirect(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDirectConversationDto,
  ): Promise<DirectConversationListItemDto> {
    const conversation = await this.chatService.createOrGetDirectConversation(
      user.sub,
      { otherUserId: dto.otherUserId },
    );
    return ChatPresentationMapper.toDirectConversationListItem(conversation);
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get a direct conversation detail' })
  @ApiOkResponse({ type: ConversationDetailDto })
  async getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<ConversationDetailDto> {
    const conversation = await this.chatService.getConversationDetail(
      user.sub,
      conversationId,
    );
    return ChatPresentationMapper.toConversationDetail(conversation);
  }

  @Patch(':conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages in a conversation as read' })
  @ApiOkResponse({ type: MarkConversationReadResponseDto })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: MarkConversationReadDto,
  ): Promise<MarkConversationReadResponseDto> {
    const result = await this.chatService.markConversationRead(
      user.sub,
      conversationId,
      { messageId: dto.messageId },
    );
    return {
      conversationId: result.conversationId,
      userId: result.userId,
      lastReadAt: result.lastReadAt.toISOString(),
      lastReadMessageId: result.lastReadMessageId,
    };
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiOkResponse({ type: MessageListResponseDto })
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageListResponseDto> {
    const result = await this.chatService.listMessages(
      user.sub,
      conversationId,
      { page: query.page, limit: query.limit },
    );
    return {
      items: result.items.map((m) =>
        ChatPresentationMapper.toMessageResponse(m),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post(':conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message (also pushed over Socket.IO /chat)' })
  @ApiCreatedResponse({ type: MessageResponseDto })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.chatService.sendMessage(
      user.sub,
      conversationId,
      { body: dto.body },
    );
    return ChatPresentationMapper.toMessageResponse(message);
  }
}
