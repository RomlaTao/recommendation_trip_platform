import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import type { MarkConversationReadResult } from '../../../application/commands/mark-conversation-read.command.js';
import type { ConversationModel } from '../../../application/models/conversation.model.js';
import type { DirectInboxRowModel } from '../../../application/models/direct-conversation-list-item.model.js';
import type {
  ConversationRepositoryPort,
  FindOrCreateDirectInput,
} from '../../../application/ports/conversation.repository.port.js';
import { CONVERSATION_TYPES } from '../../../chat.constants.js';
import { ConversationMapper } from '../mappers/conversation.mapper.js';
import { ConversationMemberOrmEntity } from '../typeorm/conversation-member.orm-entity.js';
import { ConversationOrmEntity } from '../typeorm/conversation.orm-entity.js';
import { MessageOrmEntity } from '../typeorm/message.orm-entity.js';
import { isUniqueViolation } from '../util/is-unique-violation.js';

const DIRECT_KEY_UNIQUE_INDEX = 'IDX_conversations_direct_key';

interface MembershipRow {
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  otherUserId: string;
  lastReadAt: Date | null;
}

@Injectable()
export class TypeormConversationRepository
  implements ConversationRepositoryPort
{
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly conversationRepository: Repository<ConversationOrmEntity>,
    @InjectRepository(ConversationMemberOrmEntity)
    private readonly memberRepository: Repository<ConversationMemberOrmEntity>,
    @InjectRepository(MessageOrmEntity)
    private readonly messageRepository: Repository<MessageOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<ConversationModel | null> {
    const orm = await this.conversationRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return orm ? ConversationMapper.toModel(orm) : null;
  }

  async findDirectByKey(directKey: string): Promise<ConversationModel | null> {
    const orm = await this.conversationRepository.findOne({
      where: {
        type: CONVERSATION_TYPES.DIRECT,
        directKey,
        deletedAt: IsNull(),
      },
    });
    return orm ? ConversationMapper.toModel(orm) : null;
  }

  async findOrCreateDirect(
    input: FindOrCreateDirectInput,
  ): Promise<ConversationModel> {
    const existing = await this.findDirectByKey(input.directKey);
    if (existing) {
      return existing;
    }

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const conversation = await manager.save(
          manager.create(ConversationOrmEntity, {
            type: CONVERSATION_TYPES.DIRECT,
            directKey: input.directKey,
          }),
        );
        await manager.save([
          manager.create(ConversationMemberOrmEntity, {
            conversationId: conversation.id,
            userId: input.userIdA,
            lastReadMessageId: null,
            lastReadAt: null,
          }),
          manager.create(ConversationMemberOrmEntity, {
            conversationId: conversation.id,
            userId: input.userIdB,
            lastReadMessageId: null,
            lastReadAt: null,
          }),
        ]);
        return conversation;
      });
      return ConversationMapper.toModel(saved);
    } catch (err) {
      if (isUniqueViolation(err, DIRECT_KEY_UNIQUE_INDEX)) {
        const raced = await this.findDirectByKey(input.directKey);
        if (raced) {
          return raced;
        }
      }
      throw err;
    }
  }

  async listDirectInboxForUser(userId: string): Promise<DirectInboxRowModel[]> {
    const memberships = await this.loadDirectMembershipRows(userId);
    if (memberships.length === 0) {
      return [];
    }

    const conversationIds = memberships.map((row) => row.conversationId);
    const [lastMessages, unreadCounts] = await Promise.all([
      this.loadLatestMessagesByConversationIds(conversationIds),
      this.loadUnreadCounts(userId, memberships),
    ]);

    return memberships.map((row) => ({
      conversationId: row.conversationId,
      type: CONVERSATION_TYPES.DIRECT,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      otherUserId: row.otherUserId,
      lastMessage: lastMessages.get(row.conversationId) ?? null,
      unreadCount: unreadCounts.get(row.conversationId) ?? 0,
    }));
  }

  async findDirectInboxRow(
    conversationId: string,
    userId: string,
  ): Promise<DirectInboxRowModel | null> {
    const rows = await this.loadDirectMembershipRows(userId, conversationId);
    const row = rows[0];
    if (!row) {
      return null;
    }

    const [lastMessages, unreadCounts] = await Promise.all([
      this.loadLatestMessagesByConversationIds([conversationId]),
      this.loadUnreadCounts(userId, [row]),
    ]);

    return {
      conversationId: row.conversationId,
      type: CONVERSATION_TYPES.DIRECT,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      otherUserId: row.otherUserId,
      lastMessage: lastMessages.get(conversationId) ?? null,
      unreadCount: unreadCounts.get(conversationId) ?? 0,
    };
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepository.count({
      where: { conversationId, userId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async markRead(
    conversationId: string,
    userId: string,
    messageId?: string,
  ): Promise<MarkConversationReadResult> {
    const membership = await this.memberRepository.findOne({
      where: { conversationId, userId, deletedAt: IsNull() },
    });
    if (!membership) {
      throw new Error('conversation_member_not_found');
    }

    let targetMessage: MessageOrmEntity | null = null;
    if (messageId) {
      targetMessage = await this.messageRepository.findOne({
        where: { id: messageId, conversationId, deletedAt: IsNull() },
      });
    } else {
      targetMessage = await this.messageRepository.findOne({
        where: { conversationId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });
    }

    const lastReadAt = targetMessage?.createdAt ?? new Date();
    membership.lastReadMessageId = targetMessage?.id ?? null;
    membership.lastReadAt = lastReadAt;
    await this.memberRepository.save(membership);

    return {
      conversationId,
      userId,
      lastReadAt,
      lastReadMessageId: membership.lastReadMessageId,
    };
  }

  private async loadDirectMembershipRows(
    userId: string,
    conversationId?: string,
  ): Promise<MembershipRow[]> {
    const qb = this.memberRepository
      .createQueryBuilder('me')
      .innerJoin(
        ConversationOrmEntity,
        'conversation',
        'conversation.id = me.conversationId AND conversation.deletedAt IS NULL',
      )
      .innerJoin(
        ConversationMemberOrmEntity,
        'other',
        'other.conversationId = me.conversationId AND other.userId != :userId AND other.deletedAt IS NULL',
      )
      .where('me.userId = :userId', { userId })
      .andWhere('me.deletedAt IS NULL')
      .andWhere('conversation.type = :directType', {
        directType: CONVERSATION_TYPES.DIRECT,
      })
      .select([
        'conversation.id AS "conversationId"',
        'conversation.createdAt AS "createdAt"',
        'conversation.updatedAt AS "updatedAt"',
        'other.userId AS "otherUserId"',
        'me.lastReadAt AS "lastReadAt"',
      ])
      .orderBy('conversation.updatedAt', 'DESC');

    if (conversationId) {
      qb.andWhere('conversation.id = :conversationId', { conversationId });
    }

    return qb.getRawMany<MembershipRow>();
  }

  private async loadLatestMessagesByConversationIds(
    conversationIds: string[],
  ): Promise<Map<string, DirectInboxRowModel['lastMessage']>> {
    if (conversationIds.length === 0) {
      return new Map();
    }

    const rows = await this.messageRepository
      .createQueryBuilder('message')
      .distinctOn(['message.conversationId'])
      .select([
        'message.id',
        'message.conversationId',
        'message.senderUserId',
        'message.body',
        'message.createdAt',
      ])
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('message.deletedAt IS NULL')
      .orderBy('message.conversationId', 'ASC')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();

    const map = new Map<string, DirectInboxRowModel['lastMessage']>();
    for (const row of rows) {
      map.set(row.conversationId, {
        id: row.id,
        body: row.body,
        senderUserId: row.senderUserId,
        createdAt: row.createdAt,
      });
    }
    return map;
  }

  private async loadUnreadCounts(
    userId: string,
    memberships: MembershipRow[],
  ): Promise<Map<string, number>> {
    if (memberships.length === 0) {
      return new Map();
    }

    const counts = await Promise.all(
      memberships.map(async (membership) => {
        const qb = this.messageRepository
          .createQueryBuilder('message')
          .where('message.conversationId = :conversationId', {
            conversationId: membership.conversationId,
          })
          .andWhere('message.senderUserId != :userId', { userId })
          .andWhere('message.deletedAt IS NULL');

        if (membership.lastReadAt) {
          qb.andWhere('message.createdAt > :lastReadAt', {
            lastReadAt: membership.lastReadAt,
          });
        }

        const unreadCount = await qb.getCount();
        return [membership.conversationId, unreadCount] as const;
      }),
    );

    return new Map(counts);
  }
}
