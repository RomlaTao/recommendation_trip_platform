import type { ConversationType } from '../../chat.constants.js';

export interface ConversationModel {
  id: string;
  type: ConversationType;
  directKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}
