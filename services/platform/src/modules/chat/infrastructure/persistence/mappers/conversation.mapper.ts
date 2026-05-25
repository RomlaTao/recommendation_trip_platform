import type { ConversationModel } from '../../../application/models/conversation.model.js';
import { ConversationOrmEntity } from '../typeorm/conversation.orm-entity.js';

export class ConversationMapper {
  static toModel(orm: ConversationOrmEntity): ConversationModel {
    return {
      id: orm.id,
      type: orm.type,
      directKey: orm.directKey ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }
}
