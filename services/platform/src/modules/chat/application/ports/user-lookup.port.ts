import type { ChatParticipantModel } from '../models/direct-conversation-list-item.model.js';

export interface UserLookupPort {
  exists(userId: string): Promise<boolean>;
  findPublicProfiles(userIds: string[]): Promise<ChatParticipantModel[]>;
}
