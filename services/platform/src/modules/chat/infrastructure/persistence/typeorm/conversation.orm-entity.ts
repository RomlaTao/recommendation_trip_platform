import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../../core/database/base.entity.js';
import type { ConversationType } from '../../../chat.constants.js';

@Entity('conversations')
export class ConversationOrmEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  type: ConversationType;

  @Column({ type: 'varchar', length: 80, nullable: true })
  directKey?: string | null;
}
