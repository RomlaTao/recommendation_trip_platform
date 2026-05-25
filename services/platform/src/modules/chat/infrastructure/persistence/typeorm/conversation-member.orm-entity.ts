import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { ConversationOrmEntity } from './conversation.orm-entity.js';

@Entity('conversation_members')
@Index(
  'IDX_conversation_members_conversation_user',
  ['conversationId', 'userId'],
  { unique: true },
)
export class ConversationMemberOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  conversationId: string;

  @Index('IDX_conversation_members_user_id')
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => ConversationOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationOrmEntity;

  @Column({ type: 'uuid', nullable: true, default: null })
  lastReadMessageId: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastReadAt: Date | null;
}
