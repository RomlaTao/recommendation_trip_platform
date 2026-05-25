import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import type {
  AppendMessageInput,
  ListMessagesByConversationInput,
  ListMessagesByConversationResult,
  MessageRepositoryPort,
} from '../../../application/ports/message.repository.port.js';
import type { MessageModel } from '../../../application/models/message.model.js';
import { MessageMapper } from '../mappers/message.mapper.js';
import { ConversationOrmEntity } from '../typeorm/conversation.orm-entity.js';
import { MessageOrmEntity } from '../typeorm/message.orm-entity.js';

@Injectable()
export class TypeormMessageRepository implements MessageRepositoryPort {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly messageRepository: Repository<MessageOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async append(input: AppendMessageInput): Promise<MessageModel> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(MessageOrmEntity, {
          conversationId: input.conversationId,
          senderUserId: input.senderUserId,
          body: input.body,
        }),
      );
      await manager.update(
        ConversationOrmEntity,
        { id: input.conversationId },
        { updatedAt: new Date() },
      );
      return created;
    });
    return MessageMapper.toModel(saved);
  }

  async listByConversation(
    input: ListMessagesByConversationInput,
  ): Promise<ListMessagesByConversationResult> {
    const [items, total] = await this.messageRepository.findAndCount({
      where: { conversationId: input.conversationId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });
    return {
      items: items.map((m) => MessageMapper.toModel(m)),
      total,
    };
  }

  async findLatestInConversation(
    conversationId: string,
  ): Promise<MessageModel | null> {
    const orm = await this.messageRepository.findOne({
      where: { conversationId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return orm ? MessageMapper.toModel(orm) : null;
  }

  async findByIdInConversation(
    conversationId: string,
    messageId: string,
  ): Promise<MessageModel | null> {
    const orm = await this.messageRepository.findOne({
      where: { id: messageId, conversationId, deletedAt: IsNull() },
    });
    return orm ? MessageMapper.toModel(orm) : null;
  }
}
