import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import realtimeConfig from '../../core/realtime/config/realtime.config.js';
import { UsersModule } from '../user/users.module.js';
import { ChatService } from './application/services/chat.service.js';
import {
  CHAT_REALTIME,
  CHAT_SERVER_REGISTRY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  USER_LOOKUP,
} from './chat.di-tokens.js';
import { UsersServiceUserLookupAdapter } from './infrastructure/lookups/users-service-user-lookup.adapter.js';
import { TypeormConversationRepository } from './infrastructure/persistence/repositories/typeorm-conversation.repository.js';
import { TypeormMessageRepository } from './infrastructure/persistence/repositories/typeorm-message.repository.js';
import { ConversationMemberOrmEntity } from './infrastructure/persistence/typeorm/conversation-member.orm-entity.js';
import { ConversationOrmEntity } from './infrastructure/persistence/typeorm/conversation.orm-entity.js';
import { MessageOrmEntity } from './infrastructure/persistence/typeorm/message.orm-entity.js';
import { ChatServerHolder } from './infrastructure/realtime/chat-server.holder.js';
import { NoopChatRealtimeAdapter } from './infrastructure/realtime/noop-chat-realtime.adapter.js';
import { SocketIoChatRealtimeAdapter } from './infrastructure/realtime/socket-io-chat-realtime.adapter.js';
import { ChatController } from './presentation/controllers/chat.controller.js';
import { ChatGateway } from './presentation/gateways/chat.gateway.js';

const realtimeEnabled =
  (process.env.REALTIME_ENABLED ?? 'true').toLowerCase() === 'true';

@Module({
  imports: [
    ConfigModule.forFeature(realtimeConfig),
    TypeOrmModule.forFeature([
      ConversationOrmEntity,
      ConversationMemberOrmEntity,
      MessageOrmEntity,
    ]),
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatServerHolder,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: TypeormConversationRepository,
    },
    { provide: MESSAGE_REPOSITORY, useClass: TypeormMessageRepository },
    { provide: USER_LOOKUP, useClass: UsersServiceUserLookupAdapter },
    {
      provide: CHAT_SERVER_REGISTRY,
      useExisting: ChatServerHolder,
    },
    {
      provide: CHAT_REALTIME,
      useClass: realtimeEnabled
        ? SocketIoChatRealtimeAdapter
        : NoopChatRealtimeAdapter,
    },
    ...(realtimeEnabled ? [ChatGateway] : []),
  ],
  exports: [ChatService],
})
export class ChatModule {}
