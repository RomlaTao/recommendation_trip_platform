import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../core/database/base.entity.js';
import { ConversationOrmEntity } from './conversation.orm-entity.js';

@Entity('messages')
@Index('IDX_messages_conversation_id_created_at', [
  'conversationId',
  'createdAt',
])
export class MessageOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'uuid' })
  senderUserId: string;

  @Column({ type: 'text' })
  body: string;

  @ManyToOne(() => ConversationOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationOrmEntity;
}
