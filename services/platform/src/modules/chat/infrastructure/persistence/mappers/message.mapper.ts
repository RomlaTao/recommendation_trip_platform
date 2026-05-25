import type { MessageModel } from '../../../application/models/message.model.js';
import { MessageOrmEntity } from '../typeorm/message.orm-entity.js';

export class MessageMapper {
  static toModel(orm: MessageOrmEntity): MessageModel {
    return {
      id: orm.id,
      conversationId: orm.conversationId,
      senderUserId: orm.senderUserId,
      body: orm.body,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }
}
